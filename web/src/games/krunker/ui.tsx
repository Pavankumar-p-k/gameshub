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

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
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
    const enemyIndex = enemies.findIndex(
      (enemy, index) => !enemiesDestroyed.has(index) && overlaps(bullet, enemy)
    );
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

// ─── Draw helpers ────────────────────────────────────────────────────────────

/**
 * Draws the deep-space background: a dark gradient, a nebula glow in the
 * bottom-left corner, and a scattered star field with varying sizes.
 * Stars are seeded deterministically so they don't flicker every frame.
 */
function drawBackground(ctx: CanvasRenderingContext2D, stars: StarDef[]) {
  // Deep space base gradient
  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bg.addColorStop(0, "#020510");
  bg.addColorStop(1, "#07091a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Nebula / distant planet glow — top-right corner
  const nebulaGrad = ctx.createRadialGradient(
    CANVAS_WIDTH - 80, 60, 5,
    CANVAS_WIDTH - 80, 60, 110
  );
  nebulaGrad.addColorStop(0, "rgba(120, 40, 200, 0.35)");
  nebulaGrad.addColorStop(0.4, "rgba(60, 10, 120, 0.18)");
  nebulaGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = nebulaGrad;
  ctx.fillRect(CANVAS_WIDTH - 200, 0, 200, 200);

  // Faint planet disc inside the nebula
  ctx.save();
  const planetGrad = ctx.createRadialGradient(
    CANVAS_WIDTH - 88, 52, 0,
    CANVAS_WIDTH - 88, 52, 36
  );
  planetGrad.addColorStop(0, "rgba(180, 100, 255, 0.55)");
  planetGrad.addColorStop(0.6, "rgba(90, 20, 160, 0.45)");
  planetGrad.addColorStop(1, "rgba(30, 5, 60, 0)");
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH - 88, 52, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Stars
  for (const s of stars) {
    ctx.save();
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

interface StarDef {
  x: number;
  y: number;
  r: number;
  alpha: number;
  color: string;
}

/** Generates a deterministic star field once. */
function generateStars(count: number): StarDef[] {
  // Simple seeded-ish pseudo-random using index arithmetic
  const stars: StarDef[] = [];
  const starColors = ["#ffffff", "#cce0ff", "#ffd6aa", "#aad4ff"];
  for (let i = 0; i < count; i++) {
    const t = (i * 6397 + 1) % 10000;
    const u = (i * 3571 + 7) % 10000;
    const v = (i * 1117 + 3) % 10000;
    stars.push({
      x: (t / 10000) * CANVAS_WIDTH,
      y: (u / 10000) * CANVAS_HEIGHT,
      r: 0.4 + ((v / 10000) * 1.6),
      alpha: 0.35 + ((i % 7) / 7) * 0.65,
      color: starColors[i % starColors.length],
    });
  }
  return stars;
}

/**
 * Draws the player as a top-down space fighter jet.
 * cx, cy = centre of the ship bounding box.
 */
function drawPlayer(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number) {
  ctx.save();
  ctx.translate(cx, cy);

  // --- Thruster exhaust (drawn first, behind hull) ---
  const thrusterFlicker = 0.7 + 0.3 * Math.sin(time * 0.4);
  // Left engine exhaust
  drawThruster(ctx, -7, 8, thrusterFlicker);
  // Right engine exhaust
  drawThruster(ctx, 7, 8, thrusterFlicker);

  // --- Main fuselage (elongated hexagonal body) ---
  const fuselageGrad = ctx.createLinearGradient(-6, -10, 6, 10);
  fuselageGrad.addColorStop(0, "#c8d8f0");
  fuselageGrad.addColorStop(0.3, "#7aabd4");
  fuselageGrad.addColorStop(0.65, "#3a6ea8");
  fuselageGrad.addColorStop(1, "#1a3a60");
  ctx.fillStyle = fuselageGrad;
  ctx.beginPath();
  // Pointed nose at top, wider mid-section, tapered tail
  ctx.moveTo(0, -10);      // nose tip
  ctx.lineTo(5, -4);       // nose-right shoulder
  ctx.lineTo(6, 2);        // widest right
  ctx.lineTo(4, 8);        // tail-right
  ctx.lineTo(0, 9);        // tail centre
  ctx.lineTo(-4, 8);       // tail-left
  ctx.lineTo(-6, 2);       // widest left
  ctx.lineTo(-5, -4);      // nose-left shoulder
  ctx.closePath();
  ctx.fill();

  // Fuselage highlight ridge
  ctx.strokeStyle = "rgba(200, 230, 255, 0.6)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, 7);
  ctx.stroke();

  // --- Swept-back wings ---
  // Left wing
  const wingGradL = ctx.createLinearGradient(-18, -2, -6, 6);
  wingGradL.addColorStop(0, "#1a3a60");
  wingGradL.addColorStop(0.5, "#3a6ea8");
  wingGradL.addColorStop(1, "#5a90c8");
  ctx.fillStyle = wingGradL;
  ctx.beginPath();
  ctx.moveTo(-5, -1);      // wing root top
  ctx.lineTo(-18, 6);      // swept wingtip
  ctx.lineTo(-14, 9);      // wingtip trailing
  ctx.lineTo(-4, 6);       // wing root bottom
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(100, 160, 220, 0.4)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Right wing
  const wingGradR = ctx.createLinearGradient(18, -2, 6, 6);
  wingGradR.addColorStop(0, "#1a3a60");
  wingGradR.addColorStop(0.5, "#3a6ea8");
  wingGradR.addColorStop(1, "#5a90c8");
  ctx.fillStyle = wingGradR;
  ctx.beginPath();
  ctx.moveTo(5, -1);
  ctx.lineTo(18, 6);
  ctx.lineTo(14, 9);
  ctx.lineTo(4, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(100, 160, 220, 0.4)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // --- Cockpit canopy ---
  const canopyGrad = ctx.createRadialGradient(-1.5, -5, 0.5, 0, -4, 4);
  canopyGrad.addColorStop(0, "rgba(200, 240, 255, 0.95)");
  canopyGrad.addColorStop(0.4, "rgba(100, 180, 255, 0.75)");
  canopyGrad.addColorStop(1, "rgba(20, 60, 120, 0.6)");
  ctx.fillStyle = canopyGrad;
  ctx.beginPath();
  ctx.ellipse(0, -4, 2.8, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Canopy glint
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.beginPath();
  ctx.ellipse(-0.7, -5.5, 0.7, 1.1, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // --- Dual engine pods ---
  const engineGrad = ctx.createLinearGradient(0, 0, 0, 12);
  engineGrad.addColorStop(0, "#4a7ab0");
  engineGrad.addColorStop(1, "#1a2a40");
  ctx.fillStyle = engineGrad;
  // Left engine pod
  ctx.beginPath();
  ctx.ellipse(-7, 5, 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Right engine pod
  ctx.beginPath();
  ctx.ellipse(7, 5, 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Engine nozzle rings
  ctx.strokeStyle = "#80b8e0";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(-7, 8, 1.8, 1, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(7, 8, 1.8, 1, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/** Draws a single thruster flame/glow at offset (ox, oy) from ship centre. */
function drawThruster(ctx: CanvasRenderingContext2D, ox: number, oy: number, flicker: number) {
  const flameLen = 8 * flicker;
  const thrusterGrad = ctx.createRadialGradient(ox, oy + 2, 0, ox, oy + flameLen / 2, flameLen);
  thrusterGrad.addColorStop(0, "rgba(255, 255, 180, 0.95)");
  thrusterGrad.addColorStop(0.3, "rgba(255, 140, 30, 0.75)");
  thrusterGrad.addColorStop(0.7, "rgba(100, 60, 200, 0.4)");
  thrusterGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = thrusterGrad;
  ctx.beginPath();
  ctx.ellipse(ox, oy + flameLen / 2, 2.2 * flicker, flameLen / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws an alien UFO saucer from above.
 * cx, cy = centre of the saucer bounding box.
 */
function drawEnemy(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number) {
  ctx.save();
  ctx.translate(cx, cy);

  // --- Pulsing green underside glow ---
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.07);
  const glowGrad = ctx.createRadialGradient(0, 2, 0, 0, 2, 16);
  glowGrad.addColorStop(0, `rgba(50, 255, 80, ${0.3 + pulse * 0.3})`);
  glowGrad.addColorStop(0.5, `rgba(20, 180, 40, ${0.15 + pulse * 0.15})`);
  glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.ellipse(0, 2, 16, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Saucer disc body ---
  const discGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 13);
  discGrad.addColorStop(0, "#e080e0");
  discGrad.addColorStop(0.35, "#a020c0");
  discGrad.addColorStop(0.7, "#6a0080");
  discGrad.addColorStop(1, "#2a0030");
  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Disc rim highlight
  ctx.strokeStyle = "rgba(230, 150, 255, 0.7)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Disc edge band (darker)
  ctx.strokeStyle = "rgba(60, 0, 90, 0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
  ctx.stroke();

  // --- Centre dome ---
  const domeGrad = ctx.createRadialGradient(-2, -3, 0.5, 0, -1, 6);
  domeGrad.addColorStop(0, "rgba(255, 200, 255, 0.9)");
  domeGrad.addColorStop(0.4, "rgba(200, 80, 220, 0.8)");
  domeGrad.addColorStop(1, "rgba(80, 0, 100, 0.6)");
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.ellipse(0, -1, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dome glint
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.beginPath();
  ctx.ellipse(-1.2, -2.5, 1.4, 0.9, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // --- Rotating rim indicator lights ---
  const numLights = 6;
  const rimRx = 10.5;
  const rimRy = 5;
  const rotSpeed = time * 0.06;
  for (let i = 0; i < numLights; i++) {
    const angle = (i / numLights) * Math.PI * 2 + rotSpeed;
    const lx = Math.cos(angle) * rimRx;
    const ly = Math.sin(angle) * rimRy;
    const lightPulse = 0.6 + 0.4 * Math.sin(time * 0.1 + i);
    // Glow halo
    const lightGlow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 3);
    lightGlow.addColorStop(0, `rgba(255, 60, 60, ${lightPulse})`);
    lightGlow.addColorStop(1, "rgba(255, 60, 60, 0)");
    ctx.fillStyle = lightGlow;
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fill();
    // Bright dot core
    ctx.fillStyle = `rgba(255, 200, 200, ${lightPulse})`;
    ctx.beginPath();
    ctx.arc(lx, ly, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws a plasma bolt bullet.
 * cx, cy = centre of the bullet bounding box.
 */
function drawBullet(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer glow halo
  const outerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
  outerGlow.addColorStop(0, "rgba(255, 255, 100, 0.45)");
  outerGlow.addColorStop(0.5, "rgba(255, 200, 20, 0.2)");
  outerGlow.addColorStop(1, "rgba(255, 150, 0, 0)");
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trailing glow body (elongated teardrop)
  const trailGrad = ctx.createLinearGradient(0, -6, 0, 8);
  trailGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  trailGrad.addColorStop(0.3, "rgba(255, 240, 80, 0.85)");
  trailGrad.addColorStop(0.7, "rgba(255, 160, 10, 0.55)");
  trailGrad.addColorStop(1, "rgba(255, 80, 0, 0)");
  ctx.fillStyle = trailGrad;
  ctx.beginPath();
  // Teardrop: pointed at top (direction of travel), rounded trailing end
  ctx.moveTo(0, -6);
  ctx.bezierCurveTo(2.5, -3, 3, 1, 2, 5);
  ctx.bezierCurveTo(1, 7.5, -1, 7.5, -2, 5);
  ctx.bezierCurveTo(-3, 1, -2.5, -3, 0, -6);
  ctx.closePath();
  ctx.fill();

  // Bright plasma core
  const coreGrad = ctx.createRadialGradient(0, -1, 0, 0, -1, 3);
  coreGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
  coreGrad.addColorStop(0.5, "rgba(255, 250, 150, 0.9)");
  coreGrad.addColorStop(1, "rgba(255, 200, 50, 0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.ellipse(0, -1, 2, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws the health bar at the bottom of the canvas with heart icons.
 */
function drawHealthBar(ctx: CanvasRenderingContext2D, health: number, maxHealth: number = 3) {
  const barX = 14;
  const barY = CANVAS_HEIGHT - 18;
  const heartSize = 12;
  const heartSpacing = 18;

  ctx.save();
  // Label
  ctx.fillStyle = "rgba(200, 220, 255, 0.7)";
  ctx.font = "bold 10px monospace";
  ctx.fillText("HULL", barX, barY + 1);

  for (let i = 0; i < maxHealth; i++) {
    const hx = barX + 36 + i * heartSpacing;
    const hy = barY - heartSize / 2 - 2;
    const active = i < health;
    drawHeart(ctx, hx, hy, heartSize, active);
  }
  ctx.restore();
}

/** Draws a heart icon. active = full red, inactive = dim outline. */
function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, active: boolean) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 12; // scale factor

  ctx.beginPath();
  ctx.moveTo(0, s * 3);
  ctx.bezierCurveTo(-s * 6, -s * 2, -s * 12, s * 2, -s * 6, s * 8);
  ctx.lineTo(0, s * 12);
  ctx.lineTo(s * 6, s * 8);
  ctx.bezierCurveTo(s * 12, s * 2, s * 6, -s * 2, 0, s * 3);
  ctx.closePath();

  if (active) {
    const hg = ctx.createRadialGradient(0, s * 4, 0, 0, s * 4, s * 8);
    hg.addColorStop(0, "#ff6680");
    hg.addColorStop(0.6, "#cc1133");
    hg.addColorStop(1, "#880022");
    ctx.fillStyle = hg;
    ctx.shadowColor = "rgba(255, 50, 80, 0.6)";
    ctx.shadowBlur = 6;
  } else {
    ctx.fillStyle = "rgba(80, 20, 30, 0.5)";
  }
  ctx.fill();

  ctx.strokeStyle = active ? "rgba(255, 150, 170, 0.8)" : "rgba(120, 40, 60, 0.4)";
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.restore();
}

// ─── Component ───────────────────────────────────────────────────────────────

// Generate stars once outside the component (stable across renders)
const STARS = generateStars(120);

export function KrunkerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<KrunkerState>(createInitialState);
  // Frame counter for animations
  const frameRef = useRef(0);

  const resetGame = useCallback(() => {
    setState(createInitialState());
  }, []);

  const movePlayer = useCallback((direction: -1 | 1) => {
    setState((previous) => ({
      ...previous,
      playerX: Math.max(
        0,
        Math.min(CANVAS_WIDTH - PLAYER_WIDTH, previous.playerX + direction * 16)
      ),
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

  // Game tick
  useEffect(() => {
    if (state.gameOver) {
      return;
    }

    const intervalId = window.setInterval(() => {
      frameRef.current += 1;
      setState((previous) => tick(previous));
    }, 16);

    return () => window.clearInterval(intervalId);
  }, [state.gameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        event.preventDefault();
        movePlayer(-1);
      } else if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
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

  // Canvas draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const time = frameRef.current;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Background
    drawBackground(ctx, STARS);

    // 2. Bullets (drawn behind player / enemies for depth)
    state.bullets.forEach((bullet) => {
      const cx = bullet.x + bullet.width / 2;
      const cy = bullet.y + bullet.height / 2;
      drawBullet(ctx, cx, cy);
    });

    // 3. Enemies
    state.enemies.forEach((enemy) => {
      const cx = enemy.x + enemy.width / 2;
      const cy = enemy.y + enemy.height / 2;
      drawEnemy(ctx, cx, cy, time);
    });

    // 4. Player
    const playerCx = state.playerX + PLAYER_WIDTH / 2;
    const playerCy = PLAYER_Y + PLAYER_HEIGHT / 2;
    drawPlayer(ctx, playerCx, playerCy, time);

    // 5. Health bar
    drawHealthBar(ctx, state.health);

    // 6. Game over overlay
    if (state.gameOver) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Title glow
      ctx.shadowColor = "rgba(255, 80, 80, 0.9)";
      ctx.shadowBlur = 28;
      ctx.fillStyle = "#ff4444";
      ctx.font = "bold 42px 'Courier New', monospace";
      ctx.fillText("MISSION FAILED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 28);

      ctx.shadowColor = "rgba(100, 200, 255, 0.7)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#80d0ff";
      ctx.font = "bold 18px 'Courier New', monospace";
      ctx.fillText(`SCORE: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 14);

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(180, 200, 220, 0.7)";
      ctx.font = "13px 'Courier New', monospace";
      ctx.fillText("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 44);
      ctx.restore();
    }
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
      score={state.score}
      gameOver={state.gameOver}
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
            className="focus-ring rounded-xl border border-[var(--surface-2)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]"
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
