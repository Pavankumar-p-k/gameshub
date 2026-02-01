"use client";

import { useEffect, useRef, useState } from "react";

/* =======================
   Types
======================= */
interface Sprite {
  img: HTMLImageElement;
  width: number;
  height: number;
}

interface Obstacle {
  x: number;
  y: number;
}

/* =======================
   Component
======================= */
export default function DinosaurGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // UI state only
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);

  // Game refs (NO re-render per frame)
  const dino = useRef({ x: 50, y: 140, vy: 0 });
  const obstacles = useRef<Obstacle[]>([]);
  const sprites = useRef<{
    dino?: Sprite;
    cactus?: Sprite;
    ground?: Sprite;
  }>({});
  const running = useRef(true);
  const ready = useRef(false);
  const scoreRef = useRef(0);

  /* =======================
     Constants
  ======================= */
  const GRAVITY = 0.7;
  const JUMP_FORCE = -13;
  const GROUND_Y = 160;

  /* =======================
     Load Sprites
  ======================= */
  useEffect(() => {
    const loadSprite = (src: string): Promise<Sprite> =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () =>
          resolve({ img, width: img.width, height: img.height });
      });

    Promise.all([
      loadSprite("/dino/dino.png"),
      loadSprite("/dino/cactus.png"),
      loadSprite("/dino/ground.png"),
    ]).then(([dinoImg, cactusImg, groundImg]) => {
      sprites.current = {
        dino: dinoImg,
        cactus: cactusImg,
        ground: groundImg,
      };
      ready.current = true;
      setLoading(false);
    });
  }, []);

  /* =======================
     Game Loop
  ======================= */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = 0;

    const loop = (time: number) => {
      if (!running.current) return;

      if (!ready.current) {
        requestAnimationFrame(loop);
        return;
      }

      const delta = time - lastTime;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw ground
      ctx.drawImage(
        sprites.current.ground!.img,
        0,
        GROUND_Y,
        canvas.width,
        20
      );

      // Dino physics
      dino.current.vy += GRAVITY;
      dino.current.y += dino.current.vy;

      if (dino.current.y >= 140) {
        dino.current.y = 140;
        dino.current.vy = 0;
      }

      // Draw dino
      ctx.drawImage(
        sprites.current.dino!.img,
        dino.current.x,
        dino.current.y,
        48,
        48
      );

      // Spawn obstacles
      if (Math.random() < 0.015) {
        obstacles.current.push({ x: canvas.width, y: 140 });
      }

      // Update obstacles
      obstacles.current.forEach((obs, i) => {
        obs.x -= 6;

        ctx.drawImage(
          sprites.current.cactus!.img,
          obs.x,
          obs.y,
          32,
          48
        );

        // Collision detection
        if (
          dino.current.x < obs.x + 32 &&
          dino.current.x + 48 > obs.x &&
          dino.current.y < obs.y + 48 &&
          dino.current.y + 48 > obs.y
        ) {
          running.current = false;
          setGameOver(true);
        }

        // Score
        if (obs.x < -40) {
          obstacles.current.splice(i, 1);
          scoreRef.current++;
          setScore(scoreRef.current);
        }
      });

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }, []);

  /* =======================
     Controls
  ======================= */
  const jump = () => {
    if (dino.current.vy === 0 && running.current) {
      dino.current.vy = JUMP_FORCE;
    }
  };

  const reset = () => {
    dino.current.y = 140;
    dino.current.vy = 0;
    obstacles.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    running.current = true;
    requestAnimationFrame(() => {});
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") jump();
      if (e.key === "r") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* =======================
     UI
  ======================= */
  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      <h1 className="text-3xl font-bold">🦖 Dino Runner</h1>

      {loading && <p className="text-gray-400">Loading assets…</p>}

      <p className="text-lg">Score: {score}</p>

      <canvas
        ref={canvasRef}
        width={420}
        height={200}
        className="border rounded bg-black"
        onClick={jump}
        onTouchStart={jump}
      />

      <div className="flex gap-4">
        <button
          onClick={jump}
          className="px-6 py-3 bg-green-600 text-white rounded-lg text-lg"
        >
          Jump
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gray-700 text-white rounded-lg text-lg"
        >
          Restart
        </button>
      </div>

      {gameOver && (
        <p className="text-red-500 font-bold text-xl">
          Game Over — Press Restart
        </p>
      )}
    </div>
  );
}
