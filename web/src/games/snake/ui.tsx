"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/GameFrame";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  GameState,
  Point,
  changeDirection,
  initializeGame,
  updateGame,
} from "./engine";

const CELL_SIZE = 14;

// ─── Drawing helpers ──────────────────────────────────────────────────────────

/** Draw the lush grass background with subtle garden-grid lines */
function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Base grass gradient
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#2d6a2d");
  bg.addColorStop(0.5, "#256325");
  bg.addColorStop(1, "#1a4d1a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle lighter grass patches for texture
  ctx.save();
  ctx.globalAlpha = 0.08;
  for (let row = 0; row < BOARD_HEIGHT; row++) {
    for (let col = 0; col < BOARD_WIDTH; col++) {
      if ((row + col) % 2 === 0) {
        ctx.fillStyle = "#4caf50";
        ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }
  ctx.restore();

  // Garden grid lines
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 0.5;
  for (let col = 0; col <= BOARD_WIDTH; col++) {
    ctx.beginPath();
    ctx.moveTo(col * CELL_SIZE, 0);
    ctx.lineTo(col * CELL_SIZE, height);
    ctx.stroke();
  }
  for (let row = 0; row <= BOARD_HEIGHT; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * CELL_SIZE);
    ctx.lineTo(width, row * CELL_SIZE);
    ctx.stroke();
  }
  ctx.restore();
}

/** Draw a single body segment as a shaded ellipse with scale-pattern texture */
function drawBodySegment(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  index: number,
  total: number,
) {
  const rx = CELL_SIZE * 0.46;
  const ry = CELL_SIZE * 0.46;

  // Darken slightly toward tail
  const fade = 1 - (index / total) * 0.35;
  const r = Math.round(34 * fade);
  const g = Math.round(139 * fade);
  const b = Math.round(34 * fade);

  // Radial gradient for 3-D shading
  const grad = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, rx * 0.1, cx, cy, rx);
  grad.addColorStop(0, `rgb(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 40)})`);
  grad.addColorStop(0.6, `rgb(${r},${g},${b})`);
  grad.addColorStop(1, `rgb(${Math.max(0, r - 20)},${Math.max(0, g - 40)},${Math.max(0, b - 20)})`);

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Scale pattern: two small arcs suggesting scales
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#1a5c1a";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(cx - rx * 0.25, cy + ry * 0.1, rx * 0.38, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + rx * 0.25, cy + ry * 0.1, rx * 0.38, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();

  ctx.restore();
}

/** Direction angle in radians: right=0, down=π/2, left=π, up=-π/2 */
function directionAngle(dir: Point): number {
  if (dir.x === 1) return 0;
  if (dir.x === -1) return Math.PI;
  if (dir.y === 1) return Math.PI / 2;
  return -Math.PI / 2; // up
}

/** Draw the snake head as a realistic rounded snake head, rotated per direction */
function drawSnakeHead(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  dir: Point,
  tick: number,
) {
  const angle = directionAngle(dir);
  const hw = CELL_SIZE * 0.55; // half-width
  const hh = CELL_SIZE * 0.48; // half-height

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // ── Head oval body ──
  const headGrad = ctx.createRadialGradient(-hw * 0.2, -hh * 0.2, hw * 0.05, 0, 0, hw);
  headGrad.addColorStop(0, "#6abf6a");
  headGrad.addColorStop(0.5, "#2e8b2e");
  headGrad.addColorStop(1, "#1a5c1a");
  ctx.beginPath();
  // Elongated oval: wider in X (forward direction), rounder at the back
  ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
  ctx.fillStyle = headGrad;
  ctx.fill();

  // ── Snout: a rounded bulge at the front (+x side) ──
  ctx.beginPath();
  ctx.arc(hw * 0.72, 0, hh * 0.42, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(hw * 0.4, hh * 0.42);
  ctx.arc(hw * 0.4, 0, hh * 0.42, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  const snoutGrad = ctx.createRadialGradient(hw * 0.6, -hh * 0.15, 0.5, hw * 0.6, 0, hh * 0.4);
  snoutGrad.addColorStop(0, "#7dd87d");
  snoutGrad.addColorStop(1, "#2e7d32");
  ctx.fillStyle = snoutGrad;
  ctx.fill();

  // ── Nostril dots ──
  ctx.fillStyle = "#1a3d1a";
  ctx.beginPath();
  ctx.arc(hw * 0.82, -hh * 0.18, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hw * 0.82, hh * 0.18, 0.9, 0, Math.PI * 2);
  ctx.fill();

  // ── Eyes ──
  const eyeX = hw * 0.18;
  const eyeY = hh * 0.42;
  const eyeR = CELL_SIZE * 0.095;

  for (const ey of [-eyeY, eyeY]) {
    // White sclera
    ctx.beginPath();
    ctx.arc(eyeX, ey, eyeR * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "#f0f0e0";
    ctx.fill();
    // Dark pupil (vertical slit)
    ctx.save();
    ctx.translate(eyeX, ey);
    ctx.scale(0.45, 1);
    ctx.beginPath();
    ctx.arc(0, 0, eyeR * 1.1, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();
    ctx.restore();
    // Tiny highlight
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.4, ey - eyeR * 0.5, eyeR * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fill();
  }

  // ── Forked tongue (animates with tick, only when moving) ──
  const isMoving = dir.x !== 0 || dir.y !== 0;
  if (isMoving) {
    const tongueExtend = Math.sin(tick * 0.35) > 0; // flicker in/out
    if (tongueExtend) {
      const tBase = hw * 0.9;
      const tTip = hw * 1.55;
      const fork = hh * 0.22;
      ctx.strokeStyle = "#cc1111";
      ctx.lineWidth = 0.9;
      ctx.lineCap = "round";
      // Main stem
      ctx.beginPath();
      ctx.moveTo(tBase, 0);
      ctx.lineTo(tTip - fork * 0.6, 0);
      ctx.stroke();
      // Left tine
      ctx.beginPath();
      ctx.moveTo(tTip - fork * 0.6, 0);
      ctx.lineTo(tTip, -fork);
      ctx.stroke();
      // Right tine
      ctx.beginPath();
      ctx.moveTo(tTip - fork * 0.6, 0);
      ctx.lineTo(tTip, fork);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/** Draw a realistic red apple at grid cell (gx, gy) */
function drawApple(ctx: CanvasRenderingContext2D, gx: number, gy: number) {
  const cx = gx * CELL_SIZE + CELL_SIZE / 2;
  const cy = gy * CELL_SIZE + CELL_SIZE / 2 + 1; // nudge down slightly for stem room
  const r = CELL_SIZE * 0.4;

  ctx.save();

  // ── Apple body ──
  const appleGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
  appleGrad.addColorStop(0, "#ff6b6b");
  appleGrad.addColorStop(0.5, "#e02020");
  appleGrad.addColorStop(1, "#8b0000");
  ctx.beginPath();
  // Apple silhouette: circle with a slight top indent
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = appleGrad;
  ctx.fill();

  // ── Top cleft indent ──
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.9, r * 0.14, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Highlight spot ──
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.28, cy - r * 0.32, r * 0.22, r * 0.15, -Math.PI / 5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fill();

  // ── Stem ──
  ctx.strokeStyle = "#5d3a1a";
  ctx.lineWidth = 1.1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx + 0.5, cy - r * 0.92);
  ctx.quadraticCurveTo(cx + r * 0.4, cy - r * 1.55, cx + r * 0.2, cy - r * 1.7);
  ctx.stroke();

  // ── Leaf ──
  ctx.fillStyle = "#2e8b2e";
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.18, cy - r * 1.35);
  ctx.bezierCurveTo(
    cx + r * 0.65, cy - r * 1.75,
    cx + r * 0.85, cy - r * 1.1,
    cx + r * 0.3, cy - r * 1.05,
  );
  ctx.closePath();
  ctx.fill();
  // Leaf vein
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.18, cy - r * 1.35);
  ctx.quadraticCurveTo(cx + r * 0.55, cy - r * 1.3, cx + r * 0.3, cy - r * 1.05);
  ctx.stroke();

  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const tickRef = useRef(0);
  const [gameState, setGameState] = useState<GameState>(initializeGame);

  const resetGame = useCallback(() => {
    setGameState(initializeGame());
  }, []);

  const queueDirection = useCallback((direction: Point) => {
    setGameState((previous) => changeDirection(previous, direction));
  }, []);

  useEffect(() => {
    if (gameState.gameOver) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGameState((previous) => updateGame(previous));
    }, gameState.speed);

    return () => window.clearTimeout(timeoutId);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
        event.preventDefault();
        queueDirection({ x: 0, y: -1 });
      } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
        event.preventDefault();
        queueDirection({ x: 0, y: 1 });
      } else if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        event.preventDefault();
        queueDirection({ x: -1, y: 0 });
      } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        event.preventDefault();
        queueDirection({ x: 1, y: 0 });
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [queueDirection, resetGame]);

  // ── Realistic drawing effect ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    tickRef.current += 1;
    const tick = tickRef.current;

    const { snake, food, direction } = gameState;

    // 1. Background
    drawBackground(ctx, canvas.width, canvas.height);

    // 2. Body segments (draw tail → neck, skip head at index 0)
    for (let i = snake.length - 1; i >= 1; i--) {
      const seg = snake[i];
      const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;
      drawBodySegment(ctx, cx, cy, i, snake.length);
    }

    // 3. Head
    if (snake.length > 0) {
      const head = snake[0];
      const cx = head.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = head.y * CELL_SIZE + CELL_SIZE / 2;
      drawSnakeHead(ctx, cx, cy, direction, tick);
    }

    // 4. Food (apple)
    drawApple(ctx, food.x, food.y);
  }, [gameState]);

  const onTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const threshold = 24;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      queueDirection({ x: dx > 0 ? 1 : -1, y: 0 });
    } else if (Math.abs(dy) > threshold) {
      queueDirection({ x: 0, y: dy > 0 ? 1 : -1 });
    }
    touchStart.current = null;
  };

  return (
    <GameFrame
      title="Snake"
      subtitle="Eat food, grow longer, and avoid crashing."
      status={gameState.gameOver ? "Game Over" : "Alive"}
      actions={
        <>
          <span className="chip">Score {gameState.score}</span>
          <span className="chip">Speed {Math.max(1, Math.round((220 - gameState.speed) / 10))}</span>
          <button type="button" onClick={resetGame} className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]">Restart</button>
        </>
      }
      score={gameState.score}
      gameOver={gameState.gameOver}
      footer="Controls: Arrow keys or WASD. Swipe on touch devices. Press R to restart."
    >
      <canvas
        ref={canvasRef}
        width={BOARD_WIDTH * CELL_SIZE}
        height={BOARD_HEIGHT * CELL_SIZE}
        className="mx-auto w-full max-w-[560px] rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      />
    </GameFrame>
  );
}

export default SnakeGame;
