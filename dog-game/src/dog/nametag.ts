import * as THREE from 'three';

// A dog's name, drawn on a canvas and hung over its head as a sprite (the overlays' colours: dark glass, gold text).
// One for the player's own pet, one per remote player's dog (src/net.ts).

export interface NameTag {
  sprite: THREE.Sprite;
  /** Redraws for a new name (the field on the entry screen is editable at any time). */
  set(text: string): void;
  dispose(): void;
}

const HEIGHT = 64; // canvas px
const FONT = '600 38px ui-monospace, Consolas, monospace';

function draw(text: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  let g = c.getContext('2d')!;
  g.font = FONT;
  const pad = 22;
  c.width = Math.max(48, Math.ceil(g.measureText(text).width) + pad * 2);
  c.height = HEIGHT;
  g = c.getContext('2d')!; // (resizing resets the state: font and colours again)
  g.font = FONT;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.beginPath();
  g.roundRect(2, 2, c.width - 4, c.height - 4, 12);
  g.fillStyle = 'rgba(8, 14, 20, 0.72)';
  g.fill();
  g.strokeStyle = 'rgba(242, 230, 184, 0.45)';
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = '#fff3c8';
  g.fillText(text, c.width / 2, c.height / 2 + 1);
  return c;
}

function texture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** `worldH` is the tag's height in metres; `sprite.position` places it (usually size * 1.8 above the dog). */
export function createNameTag(text: string, worldH: number): NameTag {
  let tex = texture(draw(text));
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  const fit = (): void => { sprite.scale.set(worldH * (tex.image.width as number) / (tex.image.height as number), worldH, 1); };
  fit();
  return {
    sprite,
    set(t: string): void {
      tex.dispose();
      tex = texture(draw(t));
      mat.map = tex;
      mat.needsUpdate = true;
      fit();
    },
    dispose(): void {
      tex.dispose();
      mat.dispose();
    },
  };
}
