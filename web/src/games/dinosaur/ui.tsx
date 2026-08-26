"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/GameFrame";

interface Obstacle { x: number; width: number; height: number; }
interface DinoState { y: number; vy: number; obstacles: Obstacle[]; score: number; gameOver: boolean; }

const CANVAS_WIDTH = 640; const CANVAS_HEIGHT = 240; const GROUND_Y = 180;
const DINO_X = 72; const DINO_WIDTH = 42; const DINO_HEIGHT = 44;

function overlaps(a: {x:number;y:number;width:number;height:number}, b: {x:number;y:number;width:number;height:number}): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function createInitialState(): DinoState {
  return { y: GROUND_Y - DINO_HEIGHT, vy: 0, obstacles: [], score: 0, gameOver: false };
}

function updateGame(state: DinoState): DinoState {
  if (state.gameOver) return state;
  let vy = state.vy + 0.9; let y = state.y + vy;
  if (y >= GROUND_Y - DINO_HEIGHT) { y = GROUND_Y - DINO_HEIGHT; vy = 0; }
  let obstacles = state.obstacles.map((o) => ({ ...o, x: o.x - 7 })).filter((o) => o.x + o.width > -40);
  const last = obstacles[obstacles.length - 1];
  if (!last || last.x < CANVAS_WIDTH - (170 + Math.random() * 140)) {
    obstacles = [...obstacles, { x: CANVAS_WIDTH + 12, width: 26 + Math.floor(Math.random() * 14), height: 36 + Math.floor(Math.random() * 24) }];
  }
  const dinoRect = { x: DINO_X, y, width: DINO_WIDTH, height: DINO_HEIGHT };
  const hit = obstacles.some((o) => overlaps(dinoRect, { x: o.x, y: GROUND_Y - o.height, width: o.width, height: o.height }));
  return { y, vy, obstacles, score: state.score + 1, gameOver: hit };
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D) {
  // Sky gradient: light blue → warm amber
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, "#87CEEB");
  skyGrad.addColorStop(0.6, "#c9e8f5");
  skyGrad.addColorStop(1, "#f5c97a");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

  // Distant mountain silhouette
  ctx.fillStyle = "#9db8c8";
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(0, GROUND_Y - 38);
  ctx.bezierCurveTo(30, GROUND_Y - 60, 70, GROUND_Y - 70, 110, GROUND_Y - 42);
  ctx.bezierCurveTo(130, GROUND_Y - 30, 150, GROUND_Y - 55, 180, GROUND_Y - 65);
  ctx.bezierCurveTo(210, GROUND_Y - 75, 240, GROUND_Y - 50, 270, GROUND_Y - 35);
  ctx.bezierCurveTo(300, GROUND_Y - 20, 340, GROUND_Y - 58, 380, GROUND_Y - 68);
  ctx.bezierCurveTo(420, GROUND_Y - 78, 460, GROUND_Y - 45, 500, GROUND_Y - 30);
  ctx.bezierCurveTo(540, GROUND_Y - 15, 580, GROUND_Y - 50, 640, GROUND_Y - 40);
  ctx.lineTo(640, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Rolling sand dunes just above ground
  ctx.fillStyle = "#e8c97a";
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.bezierCurveTo(80, GROUND_Y - 18, 160, GROUND_Y - 22, 240, GROUND_Y - 8);
  ctx.bezierCurveTo(320, GROUND_Y + 5, 400, GROUND_Y - 20, 480, GROUND_Y - 14);
  ctx.bezierCurveTo(540, GROUND_Y - 8, 600, GROUND_Y - 12, 640, GROUND_Y - 6);
  ctx.lineTo(640, GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

function drawGround(ctx: CanvasRenderingContext2D, tick: number) {
  // Sandy base
  const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
  groundGrad.addColorStop(0, "#d4a843");
  groundGrad.addColorStop(0.3, "#c49530");
  groundGrad.addColorStop(1, "#b07f20");
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

  // Ground top edge highlight
  ctx.strokeStyle = "#e8c060";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 1);
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 1);
  ctx.stroke();

  // Animated pebble dots (scroll with tick)
  ctx.fillStyle = "#a06820";
  const pebbles = [
    { bx: 30, by: 6, r: 2 }, { bx: 80, by: 10, r: 1.5 }, { bx: 140, by: 5, r: 2.5 },
    { bx: 200, by: 12, r: 1.5 }, { bx: 260, by: 7, r: 2 }, { bx: 310, by: 14, r: 1 },
    { bx: 370, by: 8, r: 2 }, { bx: 430, by: 5, r: 1.5 }, { bx: 490, by: 11, r: 2 },
    { bx: 550, by: 7, r: 1.5 }, { bx: 600, by: 13, r: 2 }, { bx: 650, by: 6, r: 1 },
    { bx: 100, by: 18, r: 1 }, { bx: 230, by: 20, r: 1.5 }, { bx: 400, by: 17, r: 1 },
    { bx: 520, by: 19, r: 1.5 },
  ];
  pebbles.forEach(({ bx, by, r }) => {
    const x = ((bx - (tick * 2) % CANVAS_WIDTH) + CANVAS_WIDTH) % CANVAS_WIDTH;
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y + by, r * 1.4, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Animated crack lines
  ctx.strokeStyle = "#a06820";
  ctx.lineWidth = 1;
  const cracks = [
    { bx: 60, by: 8, dx: 14, dy: 4 }, { bx: 180, by: 6, dx: -10, dy: 6 },
    { bx: 340, by: 9, dx: 12, dy: 3 }, { bx: 460, by: 7, dx: -8, dy: 5 },
    { bx: 580, by: 10, dx: 10, dy: 4 },
  ];
  cracks.forEach(({ bx, by, dx, dy }) => {
    const x = ((bx - (tick * 2) % CANVAS_WIDTH) + CANVAS_WIDTH) % CANVAS_WIDTH;
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + by);
    ctx.lineTo(x + dx, GROUND_Y + by + dy);
    ctx.stroke();
  });
}

function drawDino(ctx: CanvasRenderingContext2D, dinoY: number, isJumping: boolean, tick: number) {
  const cx = DINO_X + DINO_WIDTH / 2;
  // Anchor: feet at GROUND_Y when on ground
  const baseY = dinoY + DINO_HEIGHT;

  ctx.save();

  // ── Tail ──────────────────────────────────────────────────────────────────
  const tailGrad = ctx.createLinearGradient(cx - 22, baseY - 18, cx - 2, baseY - 6);
  tailGrad.addColorStop(0, "#5a8a1e");
  tailGrad.addColorStop(1, "#7aba28");
  ctx.fillStyle = tailGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 12, baseY - 20);
  ctx.bezierCurveTo(cx - 26, baseY - 16, cx - 34, baseY - 8, cx - 30, baseY - 2);
  ctx.bezierCurveTo(cx - 28, baseY + 1, cx - 20, baseY - 2, cx - 14, baseY - 8);
  ctx.bezierCurveTo(cx - 8, baseY - 14, cx - 6, baseY - 18, cx - 12, baseY - 20);
  ctx.closePath();
  ctx.fill();

  // ── Legs (running animation) ───────────────────────────────────────────────
  const legPhase = isJumping ? 0 : Math.sin(tick * 0.3) * 0.5;
  // Back leg
  ctx.strokeStyle = "#4a7a14";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Back leg (left)
  ctx.beginPath();
  const backHipX = cx - 6;
  const backHipY = baseY - 12;
  const backKneeX = backHipX - 5 + legPhase * 8;
  const backKneeY = backHipY + 14;
  const backFootX = backKneeX + 6 - legPhase * 4;
  const backFootY = baseY;
  ctx.moveTo(backHipX, backHipY);
  ctx.lineTo(backKneeX, backKneeY);
  ctx.lineTo(backFootX, backFootY);
  ctx.stroke();

  // Front leg (right) — opposite phase
  const frontHipX = cx + 4;
  const frontHipY = baseY - 10;
  const frontKneeX = frontHipX + 4 - legPhase * 8;
  const frontKneeY = frontHipY + 12;
  const frontFootX = frontKneeX - 4 + legPhase * 4;
  const frontFootY = baseY;
  ctx.beginPath();
  ctx.moveTo(frontHipX, frontHipY);
  ctx.lineTo(frontKneeX, frontKneeY);
  ctx.lineTo(frontFootX, frontFootY);
  ctx.stroke();

  // Claws on feet
  ctx.strokeStyle = "#2d5010";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(backFootX, backFootY);
  ctx.lineTo(backFootX + 5, backFootY + 2);
  ctx.moveTo(backFootX, backFootY);
  ctx.lineTo(backFootX + 3, backFootY + 4);
  ctx.moveTo(frontFootX, frontFootY);
  ctx.lineTo(frontFootX + 5, frontFootY + 2);
  ctx.moveTo(frontFootX, frontFootY);
  ctx.lineTo(frontFootX + 3, frontFootY + 4);
  ctx.stroke();

  // ── Body ─────────────────────────────────────────────────────────────────
  const bodyGrad = ctx.createRadialGradient(cx - 2, baseY - 22, 4, cx, baseY - 20, 22);
  bodyGrad.addColorStop(0, "#aadd44");
  bodyGrad.addColorStop(0.5, "#7aba28");
  bodyGrad.addColorStop(1, "#4a8010");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  // Body shape: wide bottom, narrowing to neck
  ctx.moveTo(cx - 14, baseY - 8);
  ctx.bezierCurveTo(cx - 18, baseY - 20, cx - 16, baseY - 36, cx - 4, baseY - 38);
  ctx.bezierCurveTo(cx + 6, baseY - 40, cx + 14, baseY - 34, cx + 16, baseY - 22);
  ctx.bezierCurveTo(cx + 18, baseY - 12, cx + 14, baseY - 4, cx + 8, baseY - 2);
  ctx.bezierCurveTo(cx, baseY, cx - 8, baseY - 2, cx - 14, baseY - 8);
  ctx.closePath();
  ctx.fill();

  // Body shadow underside
  ctx.fillStyle = "rgba(0,0,0,0.10)";
  ctx.beginPath();
  ctx.ellipse(cx + 2, baseY - 8, 12, 6, 0.1, 0, Math.PI);
  ctx.fill();

  // Belly highlight
  ctx.fillStyle = "#ccee88";
  ctx.beginPath();
  ctx.ellipse(cx + 6, baseY - 18, 5, 9, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // ── Small front arms ──────────────────────────────────────────────────────
  ctx.strokeStyle = "#4a8010";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx + 10, baseY - 30);
  ctx.bezierCurveTo(cx + 18, baseY - 26, cx + 20, baseY - 20, cx + 16, baseY - 18);
  ctx.stroke();
  // Tiny claw
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx + 16, baseY - 18);
  ctx.lineTo(cx + 20, baseY - 16);
  ctx.moveTo(cx + 16, baseY - 18);
  ctx.lineTo(cx + 18, baseY - 14);
  ctx.stroke();

  // ── Head ─────────────────────────────────────────────────────────────────
  const headCX = cx + 10;
  const headCY = baseY - 42;

  const headGrad = ctx.createRadialGradient(headCX - 4, headCY - 2, 2, headCX, headCY, 14);
  headGrad.addColorStop(0, "#bbee55");
  headGrad.addColorStop(0.5, "#7aba28");
  headGrad.addColorStop(1, "#4a8010");
  ctx.fillStyle = headGrad;

  if (isJumping) {
    // Open mouth when jumping
    // Upper jaw
    ctx.beginPath();
    ctx.moveTo(headCX - 8, headCY + 2);
    ctx.bezierCurveTo(headCX - 10, headCY - 10, headCX - 4, headCY - 16, headCX + 4, headCY - 14);
    ctx.bezierCurveTo(headCX + 14, headCY - 12, headCX + 18, headCY - 4, headCX + 16, headCY + 2);
    ctx.bezierCurveTo(headCX + 14, headCY + 6, headCX + 8, headCY + 4, headCX + 2, headCY + 4);
    ctx.closePath();
    ctx.fill();

    // Lower jaw (open)
    ctx.fillStyle = "#5a9018";
    ctx.beginPath();
    ctx.moveTo(headCX - 4, headCY + 4);
    ctx.bezierCurveTo(headCX, headCY + 10, headCX + 10, headCY + 12, headCX + 16, headCY + 8);
    ctx.bezierCurveTo(headCX + 18, headCY + 6, headCX + 16, headCY + 4, headCX + 10, headCY + 4);
    ctx.bezierCurveTo(headCX + 4, headCY + 4, headCX, headCY + 4, headCX - 4, headCY + 4);
    ctx.closePath();
    ctx.fill();

    // Inside mouth (pink/red)
    ctx.fillStyle = "#cc3030";
    ctx.beginPath();
    ctx.moveTo(headCX, headCY + 4);
    ctx.bezierCurveTo(headCX + 4, headCY + 8, headCX + 10, headCY + 9, headCX + 15, headCY + 6);
    ctx.bezierCurveTo(headCX + 14, headCY + 5, headCX + 8, headCY + 5, headCX + 4, headCY + 4);
    ctx.closePath();
    ctx.fill();

    // Teeth (upper)
    ctx.fillStyle = "#fffde0";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(headCX + 2 + i * 4, headCY + 4);
      ctx.lineTo(headCX + 4 + i * 4, headCY + 7);
      ctx.lineTo(headCX + 6 + i * 4, headCY + 4);
      ctx.fill();
    }
  } else {
    // Closed mouth
    ctx.beginPath();
    ctx.moveTo(headCX - 8, headCY + 2);
    ctx.bezierCurveTo(headCX - 10, headCY - 10, headCX - 4, headCY - 16, headCX + 4, headCY - 14);
    ctx.bezierCurveTo(headCX + 14, headCY - 12, headCX + 18, headCY - 4, headCX + 16, headCY + 4);
    ctx.bezierCurveTo(headCX + 14, headCY + 8, headCX + 4, headCY + 8, headCX - 2, headCY + 6);
    ctx.bezierCurveTo(headCX - 6, headCY + 4, headCX - 8, headCY + 4, headCX - 8, headCY + 2);
    ctx.closePath();
    ctx.fill();

    // Mouth line
    ctx.strokeStyle = "#2d5010";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(headCX + 2, headCY + 6);
    ctx.bezierCurveTo(headCX + 8, headCY + 8, headCX + 14, headCY + 7, headCX + 16, headCY + 4);
    ctx.stroke();
  }

  // Eye
  ctx.fillStyle = "#0a1a00";
  ctx.beginPath();
  ctx.ellipse(headCX + 4, headCY - 6, 3.5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.ellipse(headCX + 5.5, headCY - 7.5, 1.2, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nostril
  ctx.fillStyle = "#2d5010";
  ctx.beginPath();
  ctx.ellipse(headCX + 13, headCY - 8, 1.5, 1, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Head ridge / brow bump
  ctx.strokeStyle = "#4a8010";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(headCX - 4, headCY - 12);
  ctx.bezierCurveTo(headCX, headCY - 18, headCX + 6, headCY - 17, headCX + 8, headCY - 12);
  ctx.stroke();

  ctx.restore();
}

function drawCactus(ctx: CanvasRenderingContext2D, ox: number, oh: number, ow: number) {
  const baseX = ox + ow / 2;
  const baseY = GROUND_Y;
  const topY = baseY - oh;

  ctx.save();

  const stemW = Math.max(7, ow * 0.32);

  // Shadow on the ground
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(baseX + 4, baseY + 2, ow * 0.6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main stem — dark green body
  const stemGrad = ctx.createLinearGradient(baseX - stemW, 0, baseX + stemW, 0);
  stemGrad.addColorStop(0, "#1a5c10");
  stemGrad.addColorStop(0.35, "#2e8c1a");
  stemGrad.addColorStop(0.65, "#3aaa20");
  stemGrad.addColorStop(1, "#1a5c10");
  ctx.fillStyle = stemGrad;

  ctx.beginPath();
  ctx.moveTo(baseX - stemW / 2, baseY);
  ctx.bezierCurveTo(baseX - stemW * 0.6, baseY - oh * 0.5, baseX - stemW * 0.5, topY + 8, baseX - stemW * 0.3, topY);
  ctx.bezierCurveTo(baseX, topY - 4, baseX + stemW * 0.3, topY, baseX + stemW * 0.4, topY + 6);
  ctx.bezierCurveTo(baseX + stemW * 0.6, baseY - oh * 0.4, baseX + stemW * 0.5, baseY - 4, baseX + stemW / 2, baseY);
  ctx.closePath();
  ctx.fill();

  // Main stem highlight
  ctx.fillStyle = "rgba(180,255,140,0.22)";
  ctx.beginPath();
  ctx.moveTo(baseX - stemW * 0.1, baseY - 4);
  ctx.bezierCurveTo(baseX - stemW * 0.1, baseY - oh * 0.5, baseX, topY + 10, baseX, topY + 2);
  ctx.bezierCurveTo(baseX + stemW * 0.15, topY + 5, baseX + stemW * 0.1, baseY - oh * 0.4, baseX + stemW * 0.1, baseY - 2);
  ctx.closePath();
  ctx.fill();

  // Left arm
  const armLY = baseY - oh * 0.55;
  const armW = stemW * 0.75;
  ctx.fillStyle = stemGrad;
  ctx.beginPath();
  ctx.moveTo(baseX - stemW * 0.4, armLY + 2);
  ctx.bezierCurveTo(baseX - stemW * 2.2, armLY + 4, baseX - stemW * 2.8, armLY - oh * 0.15, baseX - stemW * 2.6, armLY - oh * 0.22);
  ctx.bezierCurveTo(baseX - stemW * 2.4, armLY - oh * 0.28, baseX - stemW * 1.8, armLY - oh * 0.2, baseX - stemW * 0.4, armLY - armW + 2);
  ctx.closePath();
  ctx.fill();

  // Left arm highlight
  ctx.fillStyle = "rgba(180,255,140,0.18)";
  ctx.beginPath();
  ctx.moveTo(baseX - stemW * 0.5, armLY);
  ctx.bezierCurveTo(baseX - stemW * 2.0, armLY + 2, baseX - stemW * 2.5, armLY - oh * 0.12, baseX - stemW * 2.3, armLY - oh * 0.18);
  ctx.bezierCurveTo(baseX - stemW * 2.0, armLY - oh * 0.08, baseX - stemW * 1.4, armLY - 4, baseX - stemW * 0.5, armLY - armW * 0.3);
  ctx.closePath();
  ctx.fill();

  // Right arm (higher)
  const armRY = baseY - oh * 0.7;
  ctx.fillStyle = stemGrad;
  ctx.beginPath();
  ctx.moveTo(baseX + stemW * 0.4, armRY + 2);
  ctx.bezierCurveTo(baseX + stemW * 2.0, armRY + 2, baseX + stemW * 2.5, armRY - oh * 0.12, baseX + stemW * 2.3, armRY - oh * 0.2);
  ctx.bezierCurveTo(baseX + stemW * 2.0, armRY - oh * 0.26, baseX + stemW * 1.5, armRY - oh * 0.18, baseX + stemW * 0.4, armRY - armW + 2);
  ctx.closePath();
  ctx.fill();

  // Right arm highlight
  ctx.fillStyle = "rgba(180,255,140,0.18)";
  ctx.beginPath();
  ctx.moveTo(baseX + stemW * 0.5, armRY);
  ctx.bezierCurveTo(baseX + stemW * 1.8, armRY, baseX + stemW * 2.2, armRY - oh * 0.08, baseX + stemW * 2.0, armRY - oh * 0.16);
  ctx.bezierCurveTo(baseX + stemW * 1.8, armRY - oh * 0.1, baseX + stemW * 1.2, armRY - 4, baseX + stemW * 0.5, armRY - armW * 0.3);
  ctx.closePath();
  ctx.fill();

  // Spine ridges on main stem
  ctx.strokeStyle = "#1a5c10";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const ry = baseY - oh * (0.15 + i * 0.15);
    ctx.beginPath();
    ctx.moveTo(baseX - stemW * 0.5, ry);
    ctx.lineTo(baseX - stemW * 0.8, ry - 2);
    ctx.moveTo(baseX + stemW * 0.5, ry);
    ctx.lineTo(baseX + stemW * 0.8, ry - 2);
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DinosaurGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<DinoState>(createInitialState);
  const tickRef = useRef(0);

  const resetGame = useCallback(() => {
    tickRef.current = 0;
    setState(createInitialState());
  }, []);

  const jump = useCallback(() => {
    setState((prev) => {
      if (prev.gameOver || prev.y < GROUND_Y - DINO_HEIGHT - 0.1) return prev;
      return { ...prev, vy: -14 };
    });
  }, []);

  useEffect(() => {
    if (state.gameOver) return;
    const id = window.setInterval(() => {
      tickRef.current += 1;
      setState((prev) => updateGame(prev));
    }, 16);
    return () => window.clearInterval(id);
  }, [state.gameOver]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") { e.preventDefault(); jump(); }
      else if (e.key === "r" || e.key === "R") { e.preventDefault(); resetGame(); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [jump, resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const tick = tickRef.current;
    const isJumping = state.y < GROUND_Y - DINO_HEIGHT - 0.5;

    // 1. Background (sky + mountains + dunes)
    drawBackground(ctx);

    // 2. Ground (sandy floor with pebbles & cracks)
    drawGround(ctx, tick);

    // 3. Obstacles (cacti)
    state.obstacles.forEach((o) => drawCactus(ctx, o.x, o.height, o.width));

    // 4. Dinosaur (T-Rex)
    drawDino(ctx, state.y, isJumping, tick);

    // 5. Game-over overlay
    if (state.gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
      ctx.font = "16px sans-serif";
      ctx.fillText("Press R or tap Restart to play again", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 18);
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
      score={Math.floor(state.score / 6)}
      gameOver={state.gameOver}
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
