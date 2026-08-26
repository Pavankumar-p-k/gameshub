"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/GameFrame";
import {
  BALL_RADIUS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GameState,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  initializeGame,
  movePlayer,
  updateGame,
} from "./engine";

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

/** Draw the dark room background with crowd silhouette at top */
function drawBackground(ctx: CanvasRenderingContext2D) {
  // Dark room gradient
  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bg.addColorStop(0, "#0a0a18");
  bg.addColorStop(1, "#0d1a2e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Crowd silhouette band at top (~40 px)
  const crowdHeight = 42;
  ctx.fillStyle = "#090910";
  ctx.fillRect(0, 0, CANVAS_WIDTH, crowdHeight);

  // Simple crowd heads — irregular bumps along the bottom of the band
  ctx.fillStyle = "#111120";
  ctx.beginPath();
  ctx.moveTo(0, crowdHeight);
  const step = 14;
  for (let x = 0; x <= CANVAS_WIDTH; x += step) {
    const h = 8 + Math.sin(x * 0.31) * 4 + Math.cos(x * 0.19) * 3;
    ctx.arc(x + step / 2, crowdHeight - h, step * 0.45, Math.PI, 0);
  }
  ctx.lineTo(CANVAS_WIDTH, crowdHeight);
  ctx.closePath();
  ctx.fill();

  // Faint spotlight glow in the center of the ceiling
  const spot = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, 0, 0,
    CANVAS_WIDTH / 2, 0, 220
  );
  spot.addColorStop(0, "rgba(255,255,220,0.07)");
  spot.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

/** Draw the ping-pong table surface, boundary lines, center dashes, and net */
function drawTable(ctx: CanvasRenderingContext2D) {
  const tableTop = 44;
  const tableBottom = CANVAS_HEIGHT - 4;

  // Table surface
  const surf = ctx.createLinearGradient(0, tableTop, 0, tableBottom);
  surf.addColorStop(0, "#0b2545");
  surf.addColorStop(1, "#0d3060");
  ctx.fillStyle = surf;
  ctx.fillRect(0, tableTop, CANVAS_WIDTH, tableBottom - tableTop);

  // Subtle table edge highlight
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, tableTop, CANVAS_WIDTH, tableBottom - tableTop);

  // Top boundary line
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, tableTop + 2);
  ctx.lineTo(CANVAS_WIDTH, tableTop + 2);
  ctx.stroke();

  // Bottom boundary line
  ctx.beginPath();
  ctx.moveTo(0, tableBottom - 2);
  ctx.lineTo(CANVAS_WIDTH, tableBottom - 2);
  ctx.stroke();

  // Dashed center line (horizontal midline)
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_HEIGHT / 2);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── NET ──────────────────────────────────────────────────────────────────
  const netX = CANVAS_WIDTH / 2;
  const netTop = tableTop + 2;
  const netBottom = tableBottom - 2;
  const netW = 6; // total visual width of net
  const cellH = 8; // height of each net cell
  const cellW = netW; // width of each net cell column

  // Net background (slightly lighter than table)
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(netX - netW / 2, netTop, netW, netBottom - netTop);

  // Vertical center post line
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(netX, netTop);
  ctx.lineTo(netX, netBottom);
  ctx.stroke();

  // Net mesh crosshatch rectangles
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 0.8;
  for (let y = netTop; y < netBottom; y += cellH) {
    const h = Math.min(cellH - 1, netBottom - y - 1);
    // Left column of mesh cell
    ctx.strokeRect(netX - cellW, y, cellW, h);
    // Right column of mesh cell
    ctx.strokeRect(netX, y, cellW, h);
  }

  // Net top bar
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(netX - netW / 2 - 1, netTop, netW + 2, 3);
  // Net bottom bar
  ctx.fillRect(netX - netW / 2 - 1, netBottom - 3, netW + 2, 3);
}

/**
 * Draw a ping-pong paddle.
 *
 * @param ctx     Canvas context
 * @param cx      Center-x of the blade face
 * @param cy      Center-y of the blade face
 * @param isAI    false → red rubber (player), true → blue rubber (AI)
 */
function drawPaddle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  isAI: boolean
) {
  // ── Geometry ────────────────────────────────────────────────────────────
  // The paddle blade is an oval.  The engine "paddle" is 12 × 72 px.
  // We'll make the blade slightly wider than PADDLE_WIDTH and fit within
  // PADDLE_HEIGHT, leaving room for the handle below.
  const bladeRx = 9;       // half-width of oval blade
  const bladeRy = 26;      // half-height of oval blade
  const edgeBand = 3;      // width of the dark edge band
  const handleW = 7;
  const handleH = 20;
  const handleX = cx - handleW / 2;
  const bladeTopY = cy - bladeRy;      // top of the blade
  const handleTopY = cy + bladeRy - 2; // handle starts just below blade
  const handleBottomY = handleTopY + handleH;

  ctx.save();

  // ── HANDLE (wooden) ────────────────────────────────────────────────────
  // Wood grain gradient
  const woodGrad = ctx.createLinearGradient(handleX, 0, handleX + handleW, 0);
  woodGrad.addColorStop(0, "#8B5E3C");
  woodGrad.addColorStop(0.25, "#C4843F");
  woodGrad.addColorStop(0.5, "#A0622A");
  woodGrad.addColorStop(0.75, "#C4843F");
  woodGrad.addColorStop(1, "#8B5E3C");

  const handleRadius = 3;
  ctx.beginPath();
  ctx.moveTo(handleX + handleRadius, handleTopY);
  ctx.lineTo(handleX + handleW - handleRadius, handleTopY);
  ctx.quadraticCurveTo(handleX + handleW, handleTopY, handleX + handleW, handleTopY + handleRadius);
  ctx.lineTo(handleX + handleW, handleBottomY - handleRadius);
  ctx.quadraticCurveTo(handleX + handleW, handleBottomY, handleX + handleW - handleRadius, handleBottomY);
  ctx.lineTo(handleX + handleRadius, handleBottomY);
  ctx.quadraticCurveTo(handleX, handleBottomY, handleX, handleBottomY - handleRadius);
  ctx.lineTo(handleX, handleTopY + handleRadius);
  ctx.quadraticCurveTo(handleX, handleTopY, handleX + handleRadius, handleTopY);
  ctx.closePath();
  ctx.fillStyle = woodGrad;
  ctx.fill();

  // Wood grain lines
  ctx.strokeStyle = "rgba(80,40,10,0.4)";
  ctx.lineWidth = 0.5;
  for (let i = 1; i < 3; i++) {
    const gx = handleX + (handleW / 3) * i;
    ctx.beginPath();
    ctx.moveTo(gx, handleTopY + 2);
    ctx.lineTo(gx + 0.5, handleBottomY - 2);
    ctx.stroke();
  }

  // Handle grip tape (two thin dark bands)
  ctx.fillStyle = "rgba(40,20,5,0.55)";
  ctx.fillRect(handleX, handleTopY + 5, handleW, 3);
  ctx.fillRect(handleX, handleTopY + 12, handleW, 3);

  // ── BLADE EDGE BAND ────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.ellipse(cx, cy, bladeRx + edgeBand, bladeRy + edgeBand, 0, 0, Math.PI * 2);
  ctx.closePath();
  const edgeGrad = ctx.createRadialGradient(cx, cy, bladeRx - 2, cx, cy, bladeRx + edgeBand + 2);
  edgeGrad.addColorStop(0, "#1a1a1a");
  edgeGrad.addColorStop(1, "#2e2e2e");
  ctx.fillStyle = edgeGrad;
  ctx.fill();

  // ── RUBBER FACE ────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.ellipse(cx, cy, bladeRx, bladeRy, 0, 0, Math.PI * 2);
  ctx.closePath();

  if (!isAI) {
    // Player: red rubber
    const rubberGrad = ctx.createRadialGradient(cx - 2, cy - 4, 1, cx, cy, bladeRx + 4);
    rubberGrad.addColorStop(0, "#ff4040");
    rubberGrad.addColorStop(0.5, "#cc1010");
    rubberGrad.addColorStop(1, "#880000");
    ctx.fillStyle = rubberGrad;
  } else {
    // AI: blue/black rubber
    const rubberGrad = ctx.createRadialGradient(cx - 2, cy - 4, 1, cx, cy, bladeRx + 4);
    rubberGrad.addColorStop(0, "#3a7bd5");
    rubberGrad.addColorStop(0.5, "#1a3a8f");
    rubberGrad.addColorStop(1, "#080c2a");
    ctx.fillStyle = rubberGrad;
  }
  ctx.fill();

  // Rubber texture: subtle pimple grid (tiny dots)
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  const dotSpacing = 5;
  for (let dy = -bladeRy + 4; dy < bladeRy - 4; dy += dotSpacing) {
    for (let dx = -bladeRx + 4; dx < bladeRx - 4; dx += dotSpacing) {
      if ((dx * dx) / (bladeRx * bladeRx) + (dy * dy) / (bladeRy * bladeRy) < 0.85) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Highlight sheen on rubber
  const sheenGrad = ctx.createLinearGradient(cx - bladeRx, bladeTopY, cx + bladeRx, cy);
  sheenGrad.addColorStop(0, "rgba(255,255,255,0.22)");
  sheenGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.ellipse(cx, cy, bladeRx, bladeRy, 0, 0, Math.PI * 2);
  ctx.fillStyle = sheenGrad;
  ctx.fill();

  // Thin inner edge separation line
  ctx.beginPath();
  ctx.ellipse(cx, cy, bladeRx, bladeRy, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.restore();
}

/** Draw a realistic ping-pong ball with radial gradient shading and a seam */
function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
) {
  ctx.save();

  // Drop shadow
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Main sphere gradient: highlight top-left, shadow bottom-right
  const sphereGrad = ctx.createRadialGradient(
    x - r * 0.35, y - r * 0.35, r * 0.05,
    x + r * 0.1,  y + r * 0.1,  r * 1.15
  );
  sphereGrad.addColorStop(0, "#ffffff");
  sphereGrad.addColorStop(0.35, "#f0f0f0");
  sphereGrad.addColorStop(0.72, "#d0d0d0");
  sphereGrad.addColorStop(1, "#a0a0a8");

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = sphereGrad;
  ctx.fill();

  // Remove shadow for seam/highlight so they stay crisp
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Seam line — a curved arc across the ball surface
  ctx.strokeStyle = "rgba(160,150,155,0.7)";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  // Upper seam arc
  ctx.arc(x, y - r * 0.1, r * 0.75, Math.PI * 0.15, Math.PI * 0.85, false);
  ctx.stroke();
  // Lower seam arc (mirrored)
  ctx.beginPath();
  ctx.arc(x, y + r * 0.1, r * 0.75, Math.PI * 1.15, Math.PI * 1.85, false);
  ctx.stroke();

  // Small specular highlight
  ctx.beginPath();
  ctx.arc(x - r * 0.28, y - r * 0.3, r * 0.22, 0, Math.PI * 2);
  const hiGrad = ctx.createRadialGradient(
    x - r * 0.3, y - r * 0.32, 0,
    x - r * 0.28, y - r * 0.3, r * 0.22
  );
  hiGrad.addColorStop(0, "rgba(255,255,255,0.9)");
  hiGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hiGrad;
  ctx.fill();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initializeGame);

  const resetGame = useCallback(() => setGameState(initializeGame()), []);

  // Game loop
  useEffect(() => {
    if (gameState.winner) return;
    const id = window.setInterval(
      () => setGameState((prev) => updateGame(prev)),
      16
    );
    return () => window.clearInterval(id);
  }, [gameState.winner]);

  // Keyboard controls
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        setGameState((prev) => movePlayer(prev, -1));
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        setGameState((prev) => movePlayer(prev, 1));
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        resetGame();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [resetGame]);

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Background + crowd
    drawBackground(ctx);

    // 2. Table surface, lines, and net
    drawTable(ctx);

    // 3. Player paddle (left side, red rubber)
    //    Engine positions: playerPaddleX = 24, blade center = 24 + PADDLE_WIDTH/2
    const playerPaddleX = 24;
    const playerCX = playerPaddleX + PADDLE_WIDTH / 2;
    const playerCY = gameState.playerY + PADDLE_HEIGHT / 2;
    drawPaddle(ctx, playerCX, playerCY, false);

    // 4. AI paddle (right side, blue rubber)
    const aiPaddleX = CANVAS_WIDTH - 24 - PADDLE_WIDTH;
    const aiCX = aiPaddleX + PADDLE_WIDTH / 2;
    const aiCY = gameState.aiY + PADDLE_HEIGHT / 2;
    drawPaddle(ctx, aiCX, aiCY, true);

    // 5. Ball
    drawBall(ctx, gameState.ball.x, gameState.ball.y, BALL_RADIUS);
  }, [gameState]);

  return (
    <GameFrame
      title="Pong"
      subtitle="First to 7 points wins."
      status={gameState.winner ? `${gameState.winner} Wins` : "In Match"}
      actions={
        <>
          <span className="chip">Player {gameState.playerScore}</span>
          <span className="chip">AI {gameState.aiScore}</span>
          <button
            type="button"
            onClick={resetGame}
            className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
          >
            Reset
          </button>
        </>
      }
      score={gameState.playerScore}
      gameOver={gameState.winner !== null}
      footer="Controls: W/S or Arrow Up/Down. Press R to restart."
    >
      <div className="space-y-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)]"
        />
        <div className="flex justify-center gap-3 sm:hidden">
          <button
            type="button"
            onClick={() => setGameState((prev) => movePlayer(prev, -1))}
            className="focus-ring rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)]"
          >
            Up
          </button>
          <button
            type="button"
            onClick={() => setGameState((prev) => movePlayer(prev, 1))}
            className="focus-ring rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)]"
          >
            Down
          </button>
        </div>
      </div>
    </GameFrame>
  );
}

export default PongGame;
