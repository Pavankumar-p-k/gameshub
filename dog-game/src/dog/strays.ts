import * as THREE from 'three';
import { DogActor } from './actor.ts';
import { BREEDS } from './breeds.ts';
import { heightAt } from '../terrain.ts';
import type { Bounds } from './types.ts';

// Stray dogs for the forest: they arrive one by one just after joining (staggered over the first seconds), then
// amble between random points around the player. Each client keeps its own pack — no server behind it. `?strays=0`
// off, `?strays=N` a count (default 6); off under the harness unless asked, so the benchmarks stay still.

export interface Strays {
  update(dt: number): void;
}

interface Stray {
  actor: DogActor;
  wait: number; // s until the next wander (or, before showing, until it arrives)
}

export function createStrays(o: {
  scene: THREE.Scene;
  bounds: Bounds | null;
  /** spawn and wander around the player (or the camera without a dog) */
  around: () => THREE.Vector3;
  count?: number;
}): Strays {
  const strays: Stray[] = [];
  for (let i = 0; i < (o.count ?? 6); i++) {
    const breed = BREEDS[(Math.random() * BREEDS.length) | 0];
    const actor = new DogActor(breed, breed.coats[(Math.random() * breed.coats.length) | 0]);
    actor.model.fur.visible = false; // (the shell shader never runs under WebGPU: src/dog/player.ts)
    actor.maxSpeed = actor.size * 6;
    actor.bounds = o.bounds;
    actor.group.traverse((m) => { if ((m as THREE.Mesh).isMesh) m.layers.enable(1); }); // (casts into the shadow map)
    actor.group.visible = false;
    o.scene.add(actor.group);
    strays.push({ actor, wait: i * 1.5 }); // they come when you join, one after another
  }

  const spawn = (s: Stray): void => {
    const c = o.around();
    const a = Math.random() * Math.PI * 2, d = 15 + Math.random() * 30;
    const x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
    s.actor.floorY = heightAt(x, z);
    s.actor.place(x, z, Math.random() * Math.PI * 2);
    s.actor.group.visible = true;
    s.wait = 0.5 + Math.random() * 2.5; // a look around, then off
  };

  const wander = (s: Stray): void => {
    s.actor.goTo(s.actor.randomPoint(28, o.around()), {
      speed: s.actor.size * 3.2, // trot
      arrive: 0.5,
      onArrive: () => { s.wait = 1 + Math.random() * 4; },
    });
  };

  return {
    update(dt: number): void {
      for (const s of strays) {
        if (!s.actor.group.visible) {
          s.wait -= dt;
          if (s.wait <= 0) spawn(s);
          continue;
        }
        if (!s.actor.moving && !s.actor.jump && s.wait > 0) {
          s.wait -= dt;
          if (s.wait <= 0) wander(s);
        }
        s.actor.floorY = heightAt(s.actor.position.x, s.actor.position.z);
        s.actor.update(dt);
      }
    },
  };
}
