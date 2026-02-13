"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/GameFrame";

interface Obstacle {
  x: number;
  width: number;
  height: number;
}

interface DinoState {
  y: number;
  vy: number;
  obstacles: Obstacle[];
  score: number;
  gameOver: boolean;
}

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 240;
const GROUND_Y = 180;
const DINO_X = 72;
const DINO_WIDTH = 42;
const DINO_HEIGHT = 44;

function overlaps(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function createInitialState(): DinoState {
  return {
    y: GROUND_Y - DINO_HEIGHT,
    vy: 0,
    obstacles: [],
    score: 0,
    gameOver: false,
  };
}

function updateGame(state: DinoState): DinoState {
  if (state.gameOver) {
    return state;
  }

  let vy = state.vy + 0.9;
  let y = state.y + vy;
  if (y >= GROUND_Y - DINO_HEIGHT) {
    y = GROUND_Y - DINO_HEIGHT;
    vy = 0;
  }

  let obstacles = state.obstacles
    .map((obstacle) => ({ ...obstacle, x: obstacle.x - 7 }))
    .filter((obstacle) => obstacle.x + obstacle.width > -40);

  const lastObstacle = obstacles[obstacles.length - 1];
  if (!lastObstacle || lastObstacle.x < CANVAS_WIDTH - (170 + Math.random() * 140)) {
    obstacles = [
      ...obstacles,
      {
        x: CANVAS_WIDTH + 12,
        width: 26 + Math.floor(Math.random() * 14),
        height: 36 + Math.floor(Math.random() * 24),
      },
    ];
  }

  const dinoRect = { x: DINO_X, y, width: DINO_WIDTH, height: DINO_HEIGHT };
  const hit = obstacles.some((obstacle) =>
    overlaps(dinoRect, {
      x: obstacle.x,
      y: GROUND_Y - obstacle.height,
      width: obstacle.width,
      height: obstacle.height,
    })
  );

  return {
    y,
    vy,
    obstacles,
    score: state.score + 1,
    gameOver: hit,
  };
}

export default function DinosaurGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<DinoState>(createInitialState);

  const resetGame = useCallback(() => {
    setState(createInitialState());
  }, []);

  const jump = useCallback(() => {
    setState((previous) => {
      if (previous.gameOver || previous.y < GROUND_Y - DINO_HEIGHT - 0.1) {
        return previous;
      }
      return { ...previous, vy: -14 };
    });
  }, []);

  useEffect(() => {
    if (state.gameOver) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setState((previous) => updateGame(previous));
    }, 16);

    return () => window.clearInterval(intervalId);
  }, [state.gameOver]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
        event.preventDefault();
        jump();
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jump, resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const gradient = context.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "rgba(56, 189, 248, 0.15)");
    gradient.addColorStop(1, "rgba(20, 19, 45, 0.75)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.strokeStyle = "rgba(255,255,255,0.18)";
    context.beginPath();
    context.moveTo(0, GROUND_Y + 1);
    context.lineTo(CANVAS_WIDTH, GROUND_Y + 1);
    context.stroke();

    context.fillStyle = "#fde047";
    context.fillRect(DINO_X, state.y, DINO_WIDTH, DINO_HEIGHT);

    context.fillStyle = "#fb7185";
    for (const obstacle of state.obstacles) {
      context.fillRect(obstacle.x, GROUND_Y - obstacle.height, obstacle.width, obstacle.height);
    }
  }, [state]);

  return (
    <GameFrame
      title="Dino Runner"
      subtitle="Jump over obstacles and survive as long as possible."
      status={state.gameOver ? "Crashed" : "Sprinting"}
      actions={
        <>
          <span className="chip">Score {Math.floor(state.score / 6)}</span>
          <button
            type="button"
            onClick={jump}
            className="focus-ring rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]"
          >
            Jump
          </button>
          <button
            type="button"
            onClick={resetGame}
            className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
          >
            Restart
          </button>
        </>
      }
      footer="Controls: Space, Up Arrow, or W to jump. Press R to restart."
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)]"
        onClick={jump}
        onTouchStart={jump}
      />
    </GameFrame>
  );
}
