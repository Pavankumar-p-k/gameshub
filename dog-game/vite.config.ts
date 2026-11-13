import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { WebSocketServer, type WebSocket } from 'ws';

// ez-tree's npm build inlines its 20 bark and leaf images (~4 MB of base64, most of the page's script) and starts
// loading them all when its module loads; the demo takes only its geometry (its own textures are in public/textures).
// So the package's source is bundled instead (it ships in the package), its textures module swapped for one that
// loads nothing (the materials ez-tree builds get no maps; nothing draws them).
const EZ_TREE = 'node_modules/@dgreenheck/ez-tree/src/lib/';
function ezTreeWithoutTextures(): Plugin {
  return {
    name: 'ez-tree-without-textures',
    enforce: 'pre',
    load(id) {
      if (id.split('?')[0].replace(/\\/g, '/').endsWith(`${EZ_TREE}textures.js`)) return 'export const getBarkTexture = () => null;\nexport const getLeafTexture = () => null;\n';
    },
  };
}

// Multiplayer's relay (src/net.ts connects to /ws): every connected client says which dog is theirs, and each pos
// message is echoed to the others. Dev server only — a static build has no socket, and the game stays single-player.
// Vite's own HMR upgrade listener only claims the `vite-hmr` subprotocol at /, so /ws passes to this one untouched.
function multiplayerRelay(): Plugin {
  return {
    name: 'dog-multiplayer-relay',
    configureServer(server) {
      interface Peer { id: number; name: string; breed: string; coat: number; x: number; y: number; z: number; h: number; s: number }
      const wss = new WebSocketServer({ noServer: true });
      const peers = new Map<WebSocket, Peer>();
      let next = 1;
      server.httpServer?.on('upgrade', (req, socket, head) => {
        if (req.url?.split('?')[0] !== '/ws') return;
        wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
      });
      const send = (ws: WebSocket, msg: unknown): void => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); };
      wss.on('connection', (ws) => {
        ws.on('message', (raw) => {
          let m: Record<string, unknown>;
          try { m = JSON.parse(String(raw)) as Record<string, unknown>; } catch { return; }
          if (m.t === 'hi') {
            const p: Peer = {
              id: next++, name: String(m.name ?? 'Dog').slice(0, 16), breed: String(m.breed ?? 'labrador').slice(0, 32),
              coat: Number(m.coat) || 0, x: 0, y: 0, z: 0, h: 0, s: 0,
            };
            peers.set(ws, p);
            send(ws, { t: 'peers', self: p.id, peers: [...peers.values()].filter((q) => q.id !== p.id) });
            for (const [other] of peers) if (other !== ws) send(other, { t: 'join', ...p });
          } else if (m.t === 'pos') {
            const p = peers.get(ws);
            if (!p) return;
            p.x = Number(m.x) || 0; p.y = Number(m.y) || 0; p.z = Number(m.z) || 0; p.h = Number(m.h) || 0; p.s = Number(m.s) || 0;
            for (const [other] of peers) if (other !== ws) send(other, { t: 'move', id: p.id, x: p.x, y: p.y, z: p.z, h: p.h, s: p.s });
          }
        });
        ws.on('close', () => {
          const p = peers.get(ws);
          peers.delete(ws);
          if (p) for (const [other] of peers) send(other, { t: 'bye', id: p.id });
        });
      });
    },
  };
}

export default defineConfig({
  base: './', // relative asset paths so dist/ works under the GitHub Pages subpath
  plugins: [ezTreeWithoutTextures(), multiplayerRelay()],
  resolve: {
    alias: [
      { find: /^@dgreenheck\/ez-tree$/, replacement: `/${EZ_TREE}index.js` },
      // (ez-tree imports 'three', in the DAG worker where it grows the trees: three's core from source, so only the
      // classes it uses are bundled; the build, with the WebGL renderer, made a ~1 MB worker)
      { find: /^three$/, replacement: 'three/src/Three.Core.js' },
    ],
  },
  // (the dev server would pre-bundle ez-tree from its npm build, past the alias and the plugin)
  optimizeDeps: { exclude: ['@dgreenheck/ez-tree'] },
  worker: { format: 'es', plugins: () => [ezTreeWithoutTextures()] }, // (ez-tree grows in the DAG worker)
  build: {
    target: 'es2022',
    // the demo, and the library's example (examples/gltf.html: a glTF scene through src/nanite-lib/ alone)
    rolldownOptions: { input: { main: fileURLToPath(new URL('./index.html', import.meta.url)), gltf: fileURLToPath(new URL('./examples/gltf.html', import.meta.url)) } },
  },
  // (the harness's scratch and output: browser profiles left by hung runs are ~100k files, and watching them held
  // up the dev server's first requests for minutes)
  server: { watch: { ignored: ['**/tools/tmp/**', '**/tools/out/**'] } },
});
