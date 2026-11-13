import * as THREE from 'three';
import { DogActor } from './actor.ts';
import { getBreed } from './breeds.ts';
import { heightAt } from '../terrain.ts';
import type { Bounds } from './types.ts';
import type { FlyControls } from '../controls.ts';

// A playable dog (the nintendogs-threejs pipeline, copied into src/dog/): WASD runs it over the terrain and the
// camera follows in third person. `?dog=0` off, `?dog=<breed>` pick a breed (default labrador), `?dogcoat=N` its
// coat. The camera's own walk/fly is switched off (FlyControls.moveEnabled): the mouse still looks around and the
// right button still zooms.
//
// The shell fur is hidden: its shader is a GLSL onBeforeCompile patch, which the WebGPU renderer never runs, and
// the shells would draw as stacked copies of the base mesh. The base skin keeps its coat (the pattern is baked into
// the vertex colours); only the shells and their per-vertex AO/roughness shading are lost.

export interface DogPlayer {
  readonly actor: DogActor;
  update(dt: number): void;
}

export interface DogPlayerOptions {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: FlyControls;
  /** spawn, at the camera's start */
  x: number;
  z: number;
  breed?: string;
  coat?: number;
  /** keep the dog inside (the forest's land, as the camera is clamped) */
  bounds?: Bounds | null;
}

export function createDogPlayer(o: DogPlayerOptions): DogPlayer {
  let breed;
  try {
    breed = getBreed(o.breed ?? 'labrador');
  } catch {
    console.warn(`Unknown dog breed "${o.breed}", using labrador`);
    breed = getBreed('labrador');
  }
  const ci = o.coat !== undefined && Number.isFinite(o.coat) ? Math.min(breed.coats.length - 1, Math.max(0, Math.floor(o.coat))) : 0;
  const actor = new DogActor(breed, breed.coats[ci]);
  actor.model.fur.visible = false; // (the shell shader above: the base skin is the dog)
  actor.maxSpeed = actor.size * 6;
  actor.bounds = o.bounds ?? null;
  // the sun's shadow camera renders layer 1 only (lighting.ts): the dog must join it to cast a shadow
  actor.group.traverse((m) => {
    if ((m as THREE.Mesh).isMesh) m.layers.enable(1);
  });
  actor.floorY = heightAt(o.x, o.z);
  actor.place(o.x, o.z, o.controls.yaw + Math.PI); // (facing where the camera looks: the camera sits behind it)
  o.scene.add(actor.group);

  const { controls, camera } = o;
  controls.moveEnabled = false; // (WASD runs the dog; the camera only follows)
  controls.pitch = Math.min(controls.pitch, -0.12); // (a little down at the dog; the mouse still looks anywhere)

  let wasJump = false;
  const wish = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const focus = new THREE.Vector3();
  const camDir = new THREE.Vector3();

  const update = (dt: number): void => {
    // WASD / the touch stick, in the camera's yaw frame
    const yaw = controls.yaw;
    fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));
    const k = controls.keys;
    wish.set(0, 0, 0);
    if (k.has('KeyW')) wish.add(fwd);
    if (k.has('KeyS')) wish.sub(fwd);
    if (k.has('KeyD')) wish.add(right);
    if (k.has('KeyA')) wish.sub(right);
    wish.addScaledVector(fwd, controls.analog.z).addScaledVector(right, controls.analog.x);
    if (wish.lengthSq() > 1e-4) {
      wish.normalize();
      const fast = k.has('ShiftLeft') || k.has('ShiftRight');
      // a point 2.4 m ahead: the actor eases its speed towards min(top, dist * 2.2), so that lands on the top
      // speed at once, and `arrive` (re-issued every frame anyway) never lets it reach the point while a key is held
      actor.goTo(wish.multiplyScalar(2.4).add(actor.position), {
        speed: actor.size * (fast ? 6 : 3.2), // gallop / trot (the gait blends by speed per body height)
        arrive: 0.25,
      });
    } else actor.stop();

    // Space (or the touch stick's up button): a hop
    const jumpHeld = k.has('Space') || controls.analog.y > 0.5;
    if (jumpHeld && !wasJump && !actor.jump) {
      const f = actor.forward; // (a shared temp: read x/z at once)
      const fx = f.x, fz = f.z;
      actor.jumpTo(new THREE.Vector3(actor.position.x + fx, actor.floorY, actor.position.z + fz), actor.size * 0.6, 0.45);
    }
    wasJump = jumpHeld;

    actor.floorY = heightAt(actor.position.x, actor.position.z);
    actor.update(dt);

    // third person: behind the dog along the view direction, the dog centred on the view axis
    camDir.set(-Math.sin(yaw) * Math.cos(controls.pitch), Math.sin(controls.pitch), -Math.cos(yaw) * Math.cos(controls.pitch));
    focus.copy(actor.position);
    focus.y += actor.size * 0.55;
    camera.position.copy(focus).addScaledVector(camDir, -Math.max(1.8, actor.size * 4.5));
  };

  return { actor, update };
}
