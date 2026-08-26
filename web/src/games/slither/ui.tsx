"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/GameFrame";

interface Point { x: number; y: number; }
interface SlitherState {
  snake: Point[]; direction: Point; queuedDirection: Point;
  food: Point; score: number; speed: number; gameOver: boolean;
}
const COLS = 30; const ROWS = 20; const CELL_SIZE = 18;

function randomFood(snake: Point[]): Point {
  let candidate: Point = { x: 0, y: 0 };
  do { candidate = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
  while (snake.some((s) => s.x === candidate.x && s.y === candidate.y));
  return candidate;
}

function createInitialState(): SlitherState {
  const snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
  return { snake, direction: { x: 1, y: 0 }, queuedDirection: { x: 1, y: 0 }, food: randomFood(snake), score: 0, speed: 130, gameOver: false };
}

function advanceGame(state: SlitherState): SlitherState {
  if (state.gameOver) return state;
  const direction = state.queuedDirection;
  const head = { x: (state.snake[0].x + direction.x + COLS) % COLS, y: (state.snake[0].y + direction.y + ROWS) % ROWS };
  if (state.snake.some((s) => s.x === head.x && s.y === head.y)) return { ...state, gameOver: true };
  const snake = [head, ...state.snake];
  let food = state.food; let score = state.score; let speed = state.speed;
  if (head.x === state.food.x && head.y === state.food.y) {
    score += 5; speed = Math.max(70, state.speed - 2); food = randomFood(snake);
  } else { snake.pop(); }
  return { snake, direction, queuedDirection: direction, food, score, speed, gameOver: false };
}

function canTurn(current: Point, next: Point): boolean {
  return !(current.x + next.x === 0 && current.y + next.y === 0);
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

/** Draw the dark hexagonal-grid background */
function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, tick: number) {
  // Deep dark background
  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
  bg.addColorStop(0, "#0d1520");
  bg.addColorStop(1, "#060c14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Hexagonal grid
  const HEX_SIZE = 22;
  const hexW = HEX_SIZE * Math.sqrt(3);
  const hexH = HEX_SIZE * 2;
  const cols = Math.ceil(w / hexW) + 2;
  const rows = Math.ceil(h / (hexH * 0.75)) + 2;

  ctx.save();
  ctx.strokeStyle = "rgba(0,255,200,0.06)";
  ctx.lineWidth = 0.5;

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const offsetX = row % 2 === 0 ? 0 : hexW / 2;
      const cx = col * hexW + offsetX;
      const cy = row * hexH * 0.75;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i - 30);
        const px = cx + HEX_SIZE * Math.cos(angle);
        const py = cy + HEX_SIZE * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();

  // Subtle pulsing vignette
  const pulse = 0.12 + 0.04 * Math.sin(tick * 0.04);
  const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${pulse})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

/** Draw one body segment as a neon oval with scale texture */
function drawBodySegment(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rx: number, ry: number,
  index: number,
  total: number
) {
  const t = index / Math.max(total - 1, 1); // 0 = near head, 1 = tail

  // Colour: vivid green → teal → darker teal towards tail
  const r = Math.round(0 + 10 * t);
  const g = Math.round(255 - 80 * t);
  const b = Math.round(120 + 80 * (1 - t));

  // Outer glow
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 1.6);
  glow.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 1.6, ry * 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body oval fill — radial gradient for 3-D look
  const bodyGrad = ctx.createRadialGradient(cx - rx * 0.25, cy - ry * 0.3, 0, cx, cy, rx);
  bodyGrad.addColorStop(0, `rgba(${Math.min(r + 80, 255)},${Math.min(g + 60, 255)},${Math.min(b + 80, 255)},1)`);
  bodyGrad.addColorStop(0.5, `rgba(${r},${g},${b},1)`);
  bodyGrad.addColorStop(1, `rgba(${Math.max(r - 40, 0)},${Math.max(g - 80, 0)},${Math.max(b - 40, 0)},1)`);

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Scale texture — small arc lines
  if (rx > 4) {
    ctx.strokeStyle = `rgba(${Math.max(r - 20, 0)},${Math.max(g - 100, 0)},${Math.max(b - 30, 0)},0.5)`;
    ctx.lineWidth = 0.6;
    for (let s = 0; s < 3; s++) {
      const sx = cx - rx * 0.4 + (s * rx * 0.4);
      ctx.beginPath();
      ctx.arc(sx, cy, ry * 0.45, -Math.PI * 0.6, Math.PI * 0.6);
      ctx.stroke();
    }
  }

  // Highlight sheen
  const sheen = ctx.createLinearGradient(cx - rx, cy - ry, cx + rx * 0.3, cy);
  sheen.addColorStop(0, "rgba(255,255,255,0.18)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.1, cy - ry * 0.15, rx * 0.65, ry * 0.45, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Draw the detailed snake head centred at (cx,cy), rotated by angle (radians) */
function drawSnakeHead(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  angle: number,
  tick: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const hw = size * 0.9;   // half-width
  const hh = size * 0.65;  // half-height

  // ── Outer glow ──────────────────────────────────────────────────────────────
  const headGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, hw * 2);
  headGlow.addColorStop(0, "rgba(0,255,160,0.4)");
  headGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = headGlow;
  ctx.beginPath();
  ctx.ellipse(0, 0, hw * 2, hh * 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Head shape ──────────────────────────────────────────────────────────────
  // Slightly pointed snout (+x direction)
  ctx.beginPath();
  ctx.moveTo(hw * 0.9, 0);                           // snout tip
  ctx.bezierCurveTo(hw, -hh * 0.6, hw * 0.2, -hh, -hw * 0.5, -hh);  // top
  ctx.bezierCurveTo(-hw, -hh * 0.5, -hw, hh * 0.5, -hw * 0.5, hh);  // back left
  ctx.bezierCurveTo(hw * 0.2, hh, hw, hh * 0.6, hw * 0.9, 0);        // bottom back to tip

  // Iridescent fill
  const iridGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
  iridGrad.addColorStop(0, "#00ffa0");
  iridGrad.addColorStop(0.35, "#00e5ff");
  iridGrad.addColorStop(0.65, "#39ff14");
  iridGrad.addColorStop(1, "#00c896");
  ctx.fillStyle = iridGrad;
  ctx.fill();

  // Head outline
  ctx.strokeStyle = "rgba(0,255,200,0.7)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // ── Scale pattern on head ────────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(0,120,80,0.45)";
  ctx.lineWidth = 0.5;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const sx = -hw * 0.5 + col * hw * 0.55;
      const sy = -hh * 0.55 + row * hh * 0.55;
      ctx.beginPath();
      ctx.arc(sx, sy, hh * 0.22, 0, Math.PI);
      ctx.stroke();
    }
  }

  // ── Eyes ─────────────────────────────────────────────────────────────────────
  const eyeOffsetX = hw * 0.3;
  const eyeOffsetY = hh * 0.35;
  const eyeR = size * 0.18;

  for (const sign of [-1, 1]) {
    const ex = eyeOffsetX;
    const ey = sign * eyeOffsetY;

    // Eye glow
    const eyeGlow = ctx.createRadialGradient(ex, ey, 0, ex, ey, eyeR * 2.5);
    eyeGlow.addColorStop(0, "rgba(255,255,80,0.6)");
    eyeGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = eyeGlow;
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // White sclera
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
    ctx.fillStyle = "#fffde0";
    ctx.fill();

    // Iris
    const irisGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, eyeR);
    irisGrad.addColorStop(0, "#ffe000");
    irisGrad.addColorStop(0.6, "#f59e00");
    irisGrad.addColorStop(1, "#b45309");
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Slit pupil (vertical ellipse)
    ctx.save();
    ctx.translate(ex, ey);
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.ellipse(0, 0, eyeR * 0.18, eyeR * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Specular highlight
    ctx.beginPath();
    ctx.arc(ex - eyeR * 0.25, ey - eyeR * 0.25, eyeR * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fill();
  }

  // ── Forked tongue (animated) ─────────────────────────────────────────────────
  const tongueFlick = Math.sin(tick * 0.25) > 0.3; // flicks in/out
  if (tongueFlick) {
    const tongueBase = hw * 0.85;
    const tongueLen = hw * 0.55;
    const forkLen = hw * 0.28;
    const forkSpread = hh * 0.22;

    ctx.save();
    ctx.strokeStyle = "#ff2255";
    ctx.lineWidth = 1.0;
    ctx.lineCap = "round";
    ctx.shadowColor = "#ff2255";
    ctx.shadowBlur = 4;

    // Base of tongue
    ctx.beginPath();
    ctx.moveTo(tongueBase, 0);
    ctx.lineTo(tongueBase + tongueLen, 0);
    ctx.stroke();

    // Top fork
    ctx.beginPath();
    ctx.moveTo(tongueBase + tongueLen, 0);
    ctx.lineTo(tongueBase + tongueLen + forkLen, -forkSpread);
    ctx.stroke();

    // Bottom fork
    ctx.beginPath();
    ctx.moveTo(tongueBase + tongueLen, 0);
    ctx.lineTo(tongueBase + tongueLen + forkLen, forkSpread);
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

/** Draw the glowing food orb with starburst sparkles */
function drawFood(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  tick: number
) {
  const pulse = 0.85 + 0.15 * Math.sin(tick * 0.12);
  const r = size * 0.42 * pulse;

  // Outer corona
  const corona = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3.5);
  corona.addColorStop(0, "rgba(255,80,200,0.35)");
  corona.addColorStop(0.5, "rgba(255,0,150,0.12)");
  corona.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Starburst rays
  const numRays = 8;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tick * 0.04);
  for (let i = 0; i < numRays; i++) {
    const rayAngle = (i / numRays) * Math.PI * 2;
    const innerR = r * 1.1;
    const outerR = r * (2.2 + 0.3 * Math.sin(tick * 0.1 + i));
    const halfAngle = Math.PI / numRays * 0.35;

    ctx.beginPath();
    ctx.moveTo(
      Math.cos(rayAngle - halfAngle) * innerR,
      Math.sin(rayAngle - halfAngle) * innerR
    );
    ctx.lineTo(Math.cos(rayAngle) * outerR, Math.sin(rayAngle) * outerR);
    ctx.lineTo(
      Math.cos(rayAngle + halfAngle) * innerR,
      Math.sin(rayAngle + halfAngle) * innerR
    );
    ctx.closePath();

    const rayGrad = ctx.createLinearGradient(0, 0, Math.cos(rayAngle) * outerR, Math.sin(rayAngle) * outerR);
    rayGrad.addColorStop(0, "rgba(255,120,220,0.8)");
    rayGrad.addColorStop(1, "rgba(255,0,200,0)");
    ctx.fillStyle = rayGrad;
    ctx.fill();
  }
  ctx.restore();

  // Sparkle dots
  ctx.save();
  ctx.translate(cx, cy);
  const sparkCount = 6;
  for (let i = 0; i < sparkCount; i++) {
    const sparkAngle = (i / sparkCount) * Math.PI * 2 + tick * 0.07;
    const sparkDist = r * (1.6 + 0.3 * Math.sin(tick * 0.15 + i * 1.2));
    const sx = Math.cos(sparkAngle) * sparkDist;
    const sy = Math.sin(sparkAngle) * sparkDist;
    const sparkR = r * 0.13 * (0.7 + 0.3 * Math.sin(tick * 0.2 + i));
    ctx.beginPath();
    ctx.arc(sx, sy, sparkR, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,200,255,0.9)";
    ctx.fill();
  }
  ctx.restore();

  // Core orb
  const orbGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  orbGrad.addColorStop(0, "#ffffff");
  orbGrad.addColorStop(0.25, "#ff80ef");
  orbGrad.addColorStop(0.6, "#e000b0");
  orbGrad.addColorStop(1, "#800060");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = orbGrad;
  ctx.fill();

  // Inner glow ring
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,150,240,0.7)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Specular highlight
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.28, cy - r * 0.3, r * 0.28, r * 0.18, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fill();
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SlitherGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const tickRef = useRef(0); // animation tick for pulsing/tongue flick
  const [state, setState] = useState<SlitherState>(createInitialState);

  const resetGame = useCallback(() => { setState(createInitialState()); }, []);
  const queueDirection = useCallback((nextDirection: Point) => {
    setState((prev) => { if (!canTurn(prev.direction, nextDirection)) return prev; return { ...prev, queuedDirection: nextDirection }; });
  }, []);

  // Game loop tick
  useEffect(() => {
    if (state.gameOver) return;
    const id = window.setTimeout(() => setState((prev) => advanceGame(prev)), state.speed);
    return () => window.clearTimeout(id);
  }, [state]);

  // Keyboard controls
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") { e.preventDefault(); queueDirection({ x: 0, y: -1 }); }
      else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { e.preventDefault(); queueDirection({ x: 0, y: 1 }); }
      else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { e.preventDefault(); queueDirection({ x: -1, y: 0 }); }
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { e.preventDefault(); queueDirection({ x: 1, y: 0 }); }
      else if (e.key === "r" || e.key === "R") { e.preventDefault(); resetGame(); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [queueDirection, resetGame]);

  // ── Canvas drawing ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    tickRef.current += 1;
    const tick = tickRef.current;

    const W = canvas.width;
    const H = canvas.height;
    const C = CELL_SIZE;
    const half = C / 2;

    // 1. Background with hex grid
    drawBackground(ctx, W, H, tick);

    // 2. Draw body segments (tail → neck, skip index 0 which is head)
    const snake = state.snake;
    const total = snake.length;

    for (let i = total - 1; i >= 1; i--) {
      const seg = snake[i];
      const cx = seg.x * C + half;
      const cy = seg.y * C + half;

      // Taper: head (i=1) is biggest, tail (i=total-1) is smallest
      const t = i / Math.max(total - 1, 1); // 0 near head, 1 at tail
      const rx = (half - 1) * (1 - t * 0.35);
      const ry = (half - 2) * (1 - t * 0.35);

      drawBodySegment(ctx, cx, cy, Math.max(rx, 3), Math.max(ry, 2), i, total);
    }

    // 3. Draw head
    if (snake.length > 0) {
      const head = snake[0];
      const hcx = head.x * C + half;
      const hcy = head.y * C + half;
      // Angle: right=0, down=π/2, left=π, up=-π/2
      const dir = state.direction;
      const angle = Math.atan2(dir.y, dir.x);
      drawSnakeHead(ctx, hcx, hcy, half, angle, tick);
    }

    // 4. Draw food
    const fcx = state.food.x * C + half;
    const fcy = state.food.y * C + half;
    drawFood(ctx, fcx, fcy, C, tick);

    // 5. Game-over overlay
    if (state.gameOver) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.62)";
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // "CRASHED" text with neon glow
      ctx.shadowColor = "#ff2255";
      ctx.shadowBlur = 24;
      ctx.fillStyle = "#ff4477";
      ctx.font = `bold ${C * 2.2}px 'Segoe UI', sans-serif`;
      ctx.fillText("CRASHED", W / 2, H / 2 - C * 1.2);

      ctx.shadowBlur = 10;
      ctx.fillStyle = "#aaffee";
      ctx.font = `${C * 0.9}px 'Segoe UI', sans-serif`;
      ctx.fillText(`Score: ${state.score}  ·  Press R to restart`, W / 2, H / 2 + C * 0.4);
      ctx.restore();
    }
  }, [state]);

  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 24) queueDirection({ x: dx > 0 ? 1 : -1, y: 0 });
    else if (Math.abs(dy) > 24) queueDirection({ x: 0, y: dy > 0 ? 1 : -1 });
    touchStart.current = null;
  };

  return (
    <GameFrame
      title="Slither"
      subtitle="Wrapped arena snake mode with rising speed."
      status={state.gameOver ? "Crashed" : "Hunting"}
      actions={
        <>
          <span className="chip">Score {state.score}</span>
          <span className="chip">Length {state.snake.length}</span>
          <button
            type="button"
            onClick={resetGame}
            className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
          >
            Restart
          </button>
        </>
      }
      score={state.score}
      gameOver={state.gameOver}
      footer="Controls: Arrow keys or WASD. Swipe on touch devices. Press R to restart."
    >
      <canvas
        ref={canvasRef}
        width={COLS * CELL_SIZE}
        height={ROWS * CELL_SIZE}
        className="mx-auto w-full max-w-[640px] rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      />
    </GameFrame>
  );
}

export default SlitherGame;
