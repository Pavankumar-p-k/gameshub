import * as THREE from 'three';
import { DogActor } from './dog/actor.ts';
import { getBreed } from './dog/breeds.ts';
import { createNameTag, type NameTag } from './dog/nametag.ts';
import { heightAt } from './terrain.ts';
import type { Bounds } from './dog/types.ts';

// Multiplayer for the dog run: the dev server relays positions (vite.config.ts's plugin on /ws), and each client
// keeps the other players' dogs in the scene, smoothed towards the last state and named over their heads. Without a
// server (a static build, or the socket down) the game simply stays single-player — it retries a few times.
// `?mp=0` off; off under the harness unless `?mp=1`, so the benchmarks open no sockets.

interface Peer {
  actor: DogActor;
  tag: NameTag;
  tx: number; tz: number; th: number; ts: number; // the last state: where to ease towards, and the gait's speed
}

export interface Multiplayer {
  /** After the player's dog in the frame: sends ours at 10 Hz, eases the others towards their last state. */
  update(dt: number): void;
  /** The HUD's row. */
  status(): string;
  close(): void;
}

const SEND_S = 0.1;

export function createMultiplayer(o: {
  scene: THREE.Scene;
  /** the player's dog: its position, heading and speed are what others see */
  actor: DogActor;
  name: () => string;
  breed: string;
  coat: number;
  bounds: Bounds | null;
}): Multiplayer {
  const peers = new Map<number, Peer>();
  let ws: WebSocket | null = null;
  let state = 'connecting';
  let sinceSend = 0;
  let retries = 0;
  let closing = false;

  const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;

  const addPeer = (id: number, name: string, breed: string, coat: number, x?: number, z?: number, h?: number, s?: number): void => {
    if (peers.has(id)) return;
    let b;
    try { b = getBreed(breed); } catch { b = getBreed('labrador'); }
    const ci = Number.isFinite(coat) ? Math.min(b.coats.length - 1, Math.max(0, Math.floor(coat))) : 0;
    const actor = new DogActor(b, b.coats[ci]);
    actor.model.fur.visible = false;
    actor.maxSpeed = actor.size * 6;
    actor.bounds = o.bounds;
    actor.group.traverse((m) => { if ((m as THREE.Mesh).isMesh) m.layers.enable(1); });
    // without a state yet, a few metres to the side of our dog (the first pos message slides them into place)
    const c = o.actor.position;
    const a = Math.random() * Math.PI * 2, d = 5 + Math.random() * 7;
    actor.place(x ?? c.x + Math.cos(a) * d, z ?? c.z + Math.sin(a) * d, h ?? Math.random() * Math.PI * 2);
    const tag = createNameTag(name || 'Dog', actor.size * 0.85);
    tag.sprite.position.set(0, actor.size * 1.8, 0);
    actor.group.add(tag.sprite);
    o.scene.add(actor.group);
    peers.set(id, { actor, tag, tx: actor.position.x, tz: actor.position.z, th: actor.heading, ts: s ?? 0 });
  };

  const removePeer = (id: number): void => {
    const p = peers.get(id);
    if (!p) return;
    o.scene.remove(p.actor.group);
    p.actor.group.traverse((m) => { const mesh = m as THREE.Mesh; if (mesh.isMesh) mesh.geometry?.dispose(); });
    p.tag.dispose();
    peers.delete(id);
  };

  const connect = (): void => {
    if (closing) return;
    try { ws = new WebSocket(url); } catch { state = 'offline'; return; }
    ws.onopen = () => {
      state = 'connected';
      retries = 0;
      ws?.send(JSON.stringify({ t: 'hi', name: o.name(), breed: o.breed, coat: o.coat }));
    };
    ws.onmessage = (ev) => {
      let m: Record<string, unknown>;
      try { m = JSON.parse(ev.data as string) as Record<string, unknown>; } catch { return; }
      if (m.t === 'peers') {
        for (const p of (m.peers as PeerInfo[] | undefined) ?? []) addPeer(p.id, p.name, p.breed, p.coat, p.x, p.z, p.h, p.s);
      } else if (m.t === 'join') {
        addPeer(m.id as number, m.name as string, m.breed as string, m.coat as number);
      } else if (m.t === 'move') {
        const p = peers.get(m.id as number);
        if (p) { p.tx = Number(m.x) || 0; p.tz = Number(m.z) || 0; p.th = Number(m.h) || 0; p.ts = Number(m.s) || 0; }
      } else if (m.t === 'bye') {
        removePeer(m.id as number);
      }
    };
    ws.onclose = () => {
      ws = null;
      for (const id of [...peers.keys()]) removePeer(id);
      if (closing) return;
      if (retries < 5) {
        retries++;
        state = 'reconnecting';
        setTimeout(connect, retries * 2000);
      } else state = 'offline';
    };
  };
  connect();

  return {
    update(dt: number): void {
      sinceSend += dt;
      if (sinceSend >= SEND_S) {
        sinceSend = 0;
        if (ws?.readyState === 1) {
          const a = o.actor;
          ws.send(JSON.stringify({ t: 'pos', x: a.position.x, y: a.position.y, z: a.position.z, h: a.heading, s: a.speed }));
        }
      }
      const k = 1 - Math.exp(-14 * dt);
      for (const p of peers.values()) {
        const a = p.actor;
        const ix = a.position.x + (p.tx - a.position.x) * k;
        const iz = a.position.z + (p.tz - a.position.z) * k;
        const dth = Math.atan2(Math.sin(p.th - a.heading), Math.cos(p.th - a.heading));
        a.heading += dth * k;
        a.speed = p.ts; // the gait (rig.speed) follows the sender's; update() decays it a touch
        a.floorY = heightAt(ix, iz);
        a.update(dt);
        // update() integrates a step along the heading and clamps to bounds: the interpolation is the truth
        a.position.x = ix;
        a.position.z = iz;
      }
    },
    status: () => (ws?.readyState === 1 ? `${1 + peers.size} in the forest` : state),
    close: (): void => {
      closing = true;
      ws?.close();
      for (const id of [...peers.keys()]) removePeer(id);
    },
  };
}

interface PeerInfo { id: number; name: string; breed: string; coat: number; x?: number; y?: number; z?: number; h?: number; s?: number }
