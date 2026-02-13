"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/GameFrame";

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface KrunkerState {
  playerX: number;
  bullets: Bullet[];
  enemies: Enemy[];
  score: number;
  health: number;
  cooldown: number;
  gameOver: boolean;
}

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 380;
const PLAYER_WIDTH = 36;
const PLAYER_HEIGHT = 20;
const PLAYER_Y = CANVAS_HEIGHT - 30;

function overlaps(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function createInitialState(): KrunkerState {
  return {
    playerX: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    bullets: [],
    enemies: [],
    score: 0,
    health: 3,
    cooldown: 0,
    gameOver: false,
  };
}

function tick(state: KrunkerState): KrunkerState {
  if (state.gameOver) {
    return state;
  }

  let health = state.health;
  const bullets = state.bullets
    .map((bullet) => ({ ...bullet, y: bullet.y - 10 }))
    .filter((bullet) => bullet.y + bullet.height > 0);

  let enemies = state.enemies
    .map((enemy) => ({ ...enemy, y: enemy.y + enemy.speed }))
    .filter((enemy) => {
      if (enemy.y > CANVAS_HEIGHT) {
        health -= 1;
        return false;
      }
      return true;
    });

  if (Math.random() < 0.05) {
    const width = 26;
    const height = 20;
    enemies = [
      ...enemies,
      {
        x: Math.random() * (CANVAS_WIDTH - width),
        y: -height,
        width,
        height,
        speed: 2 + Math.random() * 1.8,
      },
    ];
  }

  let score = state.score;
  const remainingBullets: Bullet[] = [];
  const enemiesDestroyed = new Set<number>();

  bullets.forEach((bullet) => {
    const enemyIndex = enemies.findIndex((enemy, index) => !enemiesDestroyed.has(index) && overlaps(bullet, enemy));
    if (enemyIndex >= 0) {
      enemiesDestroyed.add(enemyIndex);
      score += 10;
      return;
    }
    remainingBullets.push(bullet);
  });

  enemies = enemies.filter((_enemy, index) => !enemiesDestroyed.has(index));

  const playerHitbox = {
    x: state.playerX,
    y: PLAYER_Y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  };

  for (const enemy of enemies) {
    if (overlaps(playerHitbox, enemy)) {
      health = 0;
      break;
    }
  }

  const gameOver = health <= 0;

  return {
    ...state,
    bullets: remainingBullets,
    enemies,
    score,
    health: Math.max(0, health),
    cooldown: Math.max(0, state.cooldown - 1),
    gameOver,
  };
}

export function KrunkerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<KrunkerState>(createInitialState);

  const resetGame = useCallback(() => {
    setState(createInitialState());
  }, []);

  const movePlayer = useCallback((direction: -1 | 1) => {
    setState((previous) => ({
      ...previous,
      playerX: Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_WIDTH, previous.playerX + direction * 16)),
    }));
  }, []);

  const shoot = useCallback(() => {
    setState((previous) => {
      if (previous.gameOver || previous.cooldown > 0) {
        return previous;
      }

      return {
        ...previous,
        bullets: [
          ...previous.bullets,
          {
            x: previous.playerX + PLAYER_WIDTH / 2 - 2,
            y: PLAYER_Y - 10,
            width: 4,
            height: 12,
          },
        ],
        cooldown: 6,
      };
    });
  }, []);

  useEffect(() => {
    if (state.gameOver) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setState((previous) => tick(previous));
    }, 16);

    return () => window.clearInterval(intervalId);
  }, [state.gameOver]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        event.preventDefault();
        movePlayer(-1);
      } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        event.preventDefault();
        movePlayer(1);
      } else if (event.key === " ") {
        event.preventDefault();
        shoot();
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePlayer, resetGame, shoot]);

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
    gradient.addColorStop(0, "rgba(34, 197, 94, 0.15)");
    gradient.addColorStop(1, "rgba(2, 44, 34, 0.72)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.fillStyle = "#38bdf8";
    context.fillRect(state.playerX, PLAYER_Y, PLAYER_WIDTH, PLAYER_HEIGHT);

    context.fillStyle = "#fde047";
    state.bullets.forEach((bullet) => {
      context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    context.fillStyle = "#f87171";
    state.enemies.forEach((enemy) => {
      context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
  }, [state]);

  return (
    <GameFrame
      title="Krunker Arena"
      subtitle="Top-down shooter with enemy waves."
      status={state.gameOver ? "Mission Failed" : "Combat Active"}
      actions={
        <>
          <span className="chip">Score {state.score}</span>
          <span className="chip">Health {state.health}</span>
          <button
            type="button"
            onClick={resetGame}
            className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
          >
            Restart
          </button>
        </>
      }
      footer="Controls: Left/Right arrows or A/D to move, Space to shoot, R to restart."
    >
      <div className="space-y-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)]"
        />
        <div className="grid grid-cols-3 gap-3 sm:hidden">
          <button
            type="button"
            onClick={() => movePlayer(-1)}
            className="focus-ring rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]"
          >
            Left
          </button>
          <button
            type="button"
            onClick={shoot}
            className="focus-ring rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]"
          >
            Fire
          </button>
          <button
            type="button"
            onClick={() => movePlayer(1)}
            className="focus-ring rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]"
          >
            Right
          </button>
        </div>
      </div>
    </GameFrame>
  );
}

export default KrunkerGame;
