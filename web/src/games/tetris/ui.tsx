"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/GameFrame";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 24;

type Cell = string | null;

interface Piece {
  shape: number[][];
  color: string;
}

interface Position {
  x: number;
  y: number;
}

interface TetrisState {
  board: Cell[][];
  piece: Piece;
  position: Position;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
}

const TETROMINOES: Piece[] = [
  { shape: [[1, 1, 1, 1]], color: "#22d3ee" },
  { shape: [[1, 1], [1, 1]], color: "#fde047" },
  { shape: [[0, 1, 0], [1, 1, 1]], color: "#a855f7" },
  { shape: [[1, 0, 0], [1, 1, 1]], color: "#3b82f6" },
  { shape: [[0, 0, 1], [1, 1, 1]], color: "#f97316" },
  { shape: [[1, 1, 0], [0, 1, 1]], color: "#22c55e" },
  { shape: [[0, 1, 1], [1, 1, 0]], color: "#ef4444" },
];

function cloneShape(shape: number[][]): number[][] {
  return shape.map((row) => [...row]);
}

function createBoard(): Cell[][] {
  return Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => null));
}

function randomPiece(): Piece {
  const pick = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
  return { shape: cloneShape(pick.shape), color: pick.color };
}

function spawnPosition(piece: Piece): Position {
  return {
    x: Math.floor(BOARD_WIDTH / 2 - piece.shape[0].length / 2),
    y: 0,
  };
}

function hasCollision(board: Cell[][], piece: Piece, position: Position): boolean {
  for (let y = 0; y < piece.shape.length; y += 1) {
    for (let x = 0; x < piece.shape[y].length; x += 1) {
      if (!piece.shape[y][x]) {
        continue;
      }

      const boardX = position.x + x;
      const boardY = position.y + y;

      if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
        return true;
      }

      if (boardY >= 0 && board[boardY][boardX]) {
        return true;
      }
    }
  }
  return false;
}

function rotateShape(shape: number[][]): number[][] {
  return shape[0].map((_, colIndex) => shape.map((row) => row[colIndex]).reverse());
}

function placePiece(board: Cell[][], piece: Piece, position: Position): Cell[][] {
  const nextBoard = board.map((row) => [...row]);

  for (let y = 0; y < piece.shape.length; y += 1) {
    for (let x = 0; x < piece.shape[y].length; x += 1) {
      if (!piece.shape[y][x]) {
        continue;
      }
      const boardX = position.x + x;
      const boardY = position.y + y;
      if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
        nextBoard[boardY][boardX] = piece.color;
      }
    }
  }

  return nextBoard;
}

function clearLines(board: Cell[][]): { board: Cell[][]; linesCleared: number } {
  const keptRows = board.filter((row) => row.some((cell) => !cell));
  const linesCleared = BOARD_HEIGHT - keptRows.length;
  const clearedBoard = [
    ...Array.from({ length: linesCleared }, () => Array.from({ length: BOARD_WIDTH }, () => null)),
    ...keptRows,
  ];

  return { board: clearedBoard, linesCleared };
}

function createInitialState(): TetrisState {
  const piece = randomPiece();
  return {
    board: createBoard(),
    piece,
    position: spawnPosition(piece),
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
  };
}

function lockPiece(state: TetrisState): TetrisState {
  const mergedBoard = placePiece(state.board, state.piece, state.position);
  const { board, linesCleared } = clearLines(mergedBoard);
  const scoreDeltaMap = [0, 100, 300, 500, 800];
  const score = state.score + (scoreDeltaMap[linesCleared] ?? linesCleared * 250);
  const lines = state.lines + linesCleared;
  const level = 1 + Math.floor(lines / 10);
  const nextPiece = randomPiece();
  const nextPosition = spawnPosition(nextPiece);
  const gameOver = hasCollision(board, nextPiece, nextPosition);

  return {
    board,
    piece: nextPiece,
    position: nextPosition,
    score,
    lines,
    level,
    gameOver,
  };
}

function dropOneRow(state: TetrisState): TetrisState {
  if (state.gameOver) {
    return state;
  }

  const nextPosition = { ...state.position, y: state.position.y + 1 };
  if (hasCollision(state.board, state.piece, nextPosition)) {
    return lockPiece(state);
  }

  return { ...state, position: nextPosition };
}

function moveHorizontal(state: TetrisState, direction: -1 | 1): TetrisState {
  if (state.gameOver) {
    return state;
  }

  const nextPosition = { ...state.position, x: state.position.x + direction };
  if (hasCollision(state.board, state.piece, nextPosition)) {
    return state;
  }

  return { ...state, position: nextPosition };
}

function rotatePiece(state: TetrisState): TetrisState {
  if (state.gameOver) {
    return state;
  }

  const rotatedPiece: Piece = { ...state.piece, shape: rotateShape(state.piece.shape) };
  const kicks = [0, -1, 1, -2, 2];

  for (const kick of kicks) {
    const nextPosition = { x: state.position.x + kick, y: state.position.y };
    if (!hasCollision(state.board, rotatedPiece, nextPosition)) {
      return {
        ...state,
        piece: rotatedPiece,
        position: nextPosition,
      };
    }
  }

  return state;
}

function hardDrop(state: TetrisState): TetrisState {
  if (state.gameOver) {
    return state;
  }

  let y = state.position.y;
  while (!hasCollision(state.board, state.piece, { x: state.position.x, y: y + 1 })) {
    y += 1;
  }

  return lockPiece({ ...state, position: { ...state.position, y } });
}

// ─── colour helpers ──────────────────────────────────────────────────────────

/** Parse a 6-digit hex colour into {r,g,b} (0-255 each). */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/** Lighten or darken a hex colour by `amount` (positive = lighter, negative = darker). */
function adjustColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  const rr = clamp(r + amount).toString(16).padStart(2, "0");
  const gg = clamp(g + amount).toString(16).padStart(2, "0");
  const bb = clamp(b + amount).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

function rgbaFromHex(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── 3-D block drawing ───────────────────────────────────────────────────────

/**
 * Draw a single 3-D beveled block whose top-left canvas corner is (px, py).
 *
 * Face layout (top-down isometric-ish, all in 2-D canvas space):
 *
 *   ┌──────────────────────────────── top face ──┐
 *   │  (0,bevel)──────────────────(S,bevel)       │
 *   │   /                                  \      │
 *   │  (0,0) ────────────────────(S,0)            │
 *   └────────────────────────────────────────────┘
 *
 * We use a simpler but effective approach: three parallelogram/trapezoid faces
 * within the square cell, using a fixed bevel depth.
 *
 *  Bevel = CELL_SIZE * 0.18  (the "depth" of the 3-D illusion)
 *
 *  Top-face   : (bv,0) → (S-bv,0) → (S,bv) → (0,bv)   [lighter]
 *  Left-face  : (0,bv) → (bv,0)   → (bv,S-bv) → (0,S)  [medium/base]  -- actually left side
 *  Right-face : (S-bv,0)→(S,bv) → (S,S) → (S-bv,S-bv)  [darker]
 *  Front-face : (bv,bv) → (S-bv,bv) → (S-bv,S-bv) → (bv,S-bv)  --- wait, simpler:
 *
 * Cleaner scheme (standard beveled square):
 *   top    quad : (0,0)  (S,0)  (S-bv,bv)  (bv,bv)         ← top strip
 *   left   quad : (0,0)  (bv,bv) (bv,S-bv) (0,S)           ← left strip
 *   right  quad : (S,0)  (S-bv,bv) (S-bv,S-bv) (S,S)       ← right strip
 *   bottom quad : (0,S)  (bv,S-bv) (S-bv,S-bv) (S,S)       ← bottom strip
 *   centre rect : (bv,bv) → (S-bv,S-bv)                    ← main face
 */
function draw3DBlock(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  color: string,
  alpha = 1
) {
  const S = CELL_SIZE;
  const bv = Math.round(S * 0.18); // bevel depth

  // Face colours
  const top    = adjustColor(color, +75);   // very light
  const left   = adjustColor(color, +25);   // slightly light
  const centre = color;                      // base
  const right  = adjustColor(color, -55);   // darker
  const bottom = adjustColor(color, -80);   // darkest

  const drawFace = (points: [number, number][], fill: string) => {
    ctx.beginPath();
    ctx.moveTo(px + points[0][0], py + points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(px + points[i][0], py + points[i][1]);
    }
    ctx.closePath();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    ctx.fill();
  };

  // Top bevel strip
  drawFace([[0, 0], [S, 0], [S - bv, bv], [bv, bv]], top);
  // Left bevel strip
  drawFace([[0, 0], [bv, bv], [bv, S - bv], [0, S]], left);
  // Right bevel strip
  drawFace([[S, 0], [S - bv, bv], [S - bv, S - bv], [S, S]], right);
  // Bottom bevel strip
  drawFace([[0, S], [bv, S - bv], [S - bv, S - bv], [S, S]], bottom);
  // Centre face
  drawFace([[bv, bv], [S - bv, bv], [S - bv, S - bv], [bv, S - bv]], centre);

  // Inner shine on centre face (top-left diagonal glint)
  ctx.globalAlpha = alpha * 0.35;
  const shineGrad = ctx.createLinearGradient(px + bv, py + bv, px + S - bv, py + S - bv);
  shineGrad.addColorStop(0, "rgba(255,255,255,0.55)");
  shineGrad.addColorStop(0.45, "rgba(255,255,255,0.0)");
  ctx.fillStyle = shineGrad;
  ctx.beginPath();
  ctx.moveTo(px + bv, py + bv);
  ctx.lineTo(px + S - bv, py + bv);
  ctx.lineTo(px + S - bv, py + S - bv);
  ctx.lineTo(px + bv, py + S - bv);
  ctx.closePath();
  ctx.fill();

  // Thin highlight on top bevel strip
  ctx.globalAlpha = alpha * 0.7;
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(px + 1, py + 1);
  ctx.lineTo(px + S - 1, py + 1);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

// ─── ghost piece helper ───────────────────────────────────────────────────────

function getGhostPosition(state: TetrisState): Position {
  let y = state.position.y;
  while (!hasCollision(state.board, state.piece, { x: state.position.x, y: y + 1 })) {
    y += 1;
  }
  return { x: state.position.x, y };
}

// ─── main draw function ───────────────────────────────────────────────────────

function drawState(context: CanvasRenderingContext2D, state: TetrisState) {
  const W = BOARD_WIDTH * CELL_SIZE;
  const H = BOARD_HEIGHT * CELL_SIZE;
  const S = CELL_SIZE;

  // ── board background ──────────────────────────────────────────────────────
  context.clearRect(0, 0, W, H);

  // Dark stone/glass base gradient
  const bgGrad = context.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#0d1117");
  bgGrad.addColorStop(0.5, "#111827");
  bgGrad.addColorStop(1, "#0a0f1a");
  context.fillStyle = bgGrad;
  context.fillRect(0, 0, W, H);

  // Very faint grid lines (stone-tile effect)
  context.lineWidth = 0.5;
  context.strokeStyle = "rgba(148, 163, 184, 0.07)";
  for (let col = 0; col <= BOARD_WIDTH; col++) {
    context.beginPath();
    context.moveTo(col * S, 0);
    context.lineTo(col * S, H);
    context.stroke();
  }
  for (let row = 0; row <= BOARD_HEIGHT; row++) {
    context.beginPath();
    context.moveTo(0, row * S);
    context.lineTo(W, row * S);
    context.stroke();
  }

  // Subtle inner vignette
  const vignette = context.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.45)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, W, H);

  // ── locked board cells ────────────────────────────────────────────────────
  state.board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        draw3DBlock(context, x * S, y * S, cell);
      }
    });
  });

  // ── ghost piece ───────────────────────────────────────────────────────────
  if (!state.gameOver) {
    const ghost = getGhostPosition(state);
    // Only draw ghost if it differs from current position
    if (ghost.y !== state.position.y) {
      const { r, g, b } = hexToRgb(state.piece.color);
      state.piece.shape.forEach((row, dy) => {
        row.forEach((cell, dx) => {
          if (!cell) return;
          const px = (ghost.x + dx) * S;
          const py = (ghost.y + dy) * S;
          const bv = Math.round(S * 0.18);

          // Ghost: just an outline of the cube faces, no fill
          context.globalAlpha = 0.55;
          context.strokeStyle = `rgba(${r},${g},${b},0.9)`;
          context.lineWidth = 1;

          // Outer border
          context.beginPath();
          context.moveTo(px + 1, py + 1);
          context.lineTo(px + S - 1, py + 1);
          context.lineTo(px + S - 1, py + S - 1);
          context.lineTo(px + 1, py + S - 1);
          context.closePath();
          context.stroke();

          // Bevel corner lines to suggest 3-D depth
          context.globalAlpha = 0.35;
          context.strokeStyle = `rgba(${r},${g},${b},0.7)`;
          context.lineWidth = 0.75;

          // Top bevel line
          context.beginPath();
          context.moveTo(px + bv, py + bv);
          context.lineTo(px + S - bv, py + bv);
          context.stroke();
          // Left bevel line
          context.beginPath();
          context.moveTo(px + bv, py + bv);
          context.lineTo(px + bv, py + S - bv);
          context.stroke();

          context.globalAlpha = 1;
        });
      });
    }
  }

  // ── active falling piece with glow ────────────────────────────────────────
  if (!state.gameOver) {
    const { r, g, b } = hexToRgb(state.piece.color);

    // Glow / aura: soft shadow around the piece
    context.save();
    context.shadowColor = `rgba(${r},${g},${b},0.85)`;
    context.shadowBlur = 18;

    state.piece.shape.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (!cell) return;
        const px = (state.position.x + dx) * S;
        const py = (state.position.y + dy) * S;

        // Draw a faint glow rect first (so the shadow registers)
        context.globalAlpha = 0.01;
        context.fillStyle = `rgba(${r},${g},${b},1)`;
        context.fillRect(px, py, S, S);
        context.globalAlpha = 1;
      });
    });

    context.restore();

    // Now draw the actual 3-D blocks on top of the glow
    state.piece.shape.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (!cell) return;
        const px = (state.position.x + dx) * S;
        const py = (state.position.y + dy) * S;
        draw3DBlock(context, px, py, state.piece.color);
      });
    });
  }

  // ── GAME OVER overlay ─────────────────────────────────────────────────────
  if (state.gameOver) {
    // Dark translucent veil
    context.globalAlpha = 0.72;
    context.fillStyle = "#000000";
    context.fillRect(0, 0, W, H);
    context.globalAlpha = 1;

    // Vivid red-to-orange gradient title
    const titleGrad = context.createLinearGradient(W / 2 - 80, 0, W / 2 + 80, 0);
    titleGrad.addColorStop(0, "#ff4444");
    titleGrad.addColorStop(0.5, "#ff8800");
    titleGrad.addColorStop(1, "#ff4444");

    context.textAlign = "center";
    context.textBaseline = "middle";

    // Outer glow for the title
    context.save();
    context.shadowColor = "rgba(255,80,0,0.9)";
    context.shadowBlur = 28;

    context.font = `bold ${Math.round(S * 1.35)}px 'Segoe UI', system-ui, sans-serif`;
    context.fillStyle = titleGrad;
    context.fillText("GAME", W / 2, H / 2 - S * 1.1);
    context.fillText("OVER", W / 2, H / 2 + S * 0.1);

    context.restore();

    // Subtitle
    context.globalAlpha = 0.75;
    context.font = `${Math.round(S * 0.5)}px 'Segoe UI', system-ui, sans-serif`;
    context.fillStyle = "#e2e8f0";
    context.fillText("Press R to restart", W / 2, H / 2 + S * 1.55);
    context.globalAlpha = 1;

    // Thin decorative lines above/below text
    const lineY1 = H / 2 - S * 1.9;
    const lineY2 = H / 2 + S * 2.1;
    context.strokeStyle = "rgba(255,120,0,0.55)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(W * 0.1, lineY1);
    context.lineTo(W * 0.9, lineY1);
    context.stroke();
    context.beginPath();
    context.moveTo(W * 0.1, lineY2);
    context.lineTo(W * 0.9, lineY2);
    context.stroke();
  }
}

export function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<TetrisState>(createInitialState);

  const resetGame = useCallback(() => {
    setState(createInitialState());
  }, []);

  useEffect(() => {
    if (state.gameOver) {
      return;
    }

    const delay = Math.max(110, 700 - (state.level - 1) * 50);
    const timeoutId = window.setTimeout(() => {
      setState((previous) => dropOneRow(previous));
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [state]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        event.preventDefault();
        setState((previous) => moveHorizontal(previous, -1));
      } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        event.preventDefault();
        setState((previous) => moveHorizontal(previous, 1));
      } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
        event.preventDefault();
        setState((previous) => dropOneRow(previous));
      } else if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
        event.preventDefault();
        setState((previous) => rotatePiece(previous));
      } else if (event.key === " ") {
        event.preventDefault();
        setState((previous) => hardDrop(previous));
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    drawState(context, state);
  }, [state]);

  return (
    <GameFrame
      title="Tetris"
      subtitle="Stack pieces, clear rows, and survive increasing speed."
      status={state.gameOver ? "Top Out" : `Level ${state.level}`}
      actions={
        <>
          <span className="chip">Score {state.score}</span>
          <span className="chip">Lines {state.lines}</span>
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
      footer="Controls: Arrows or WASD. Space = hard drop. R = restart."
    >
      <div className="mx-auto w-full max-w-[320px]">
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH * CELL_SIZE}
          height={BOARD_HEIGHT * CELL_SIZE}
          className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)]"
        />
      </div>
    </GameFrame>
  );
}

export default TetrisGame;
