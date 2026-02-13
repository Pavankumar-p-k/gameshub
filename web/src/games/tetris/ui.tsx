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

function drawState(context: CanvasRenderingContext2D, state: TetrisState) {
  context.clearRect(0, 0, BOARD_WIDTH * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);

  const gradient = context.createLinearGradient(0, 0, 0, BOARD_HEIGHT * CELL_SIZE);
  gradient.addColorStop(0, "rgba(59, 130, 246, 0.18)");
  gradient.addColorStop(1, "rgba(17, 24, 39, 0.85)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, BOARD_WIDTH * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);

  state.board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell) {
        context.strokeStyle = "rgba(148, 163, 184, 0.1)";
        context.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        return;
      }
      context.fillStyle = cell;
      context.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    });
  });

  state.piece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell) {
        return;
      }
      context.fillStyle = state.piece.color;
      context.fillRect(
        (state.position.x + x) * CELL_SIZE + 1,
        (state.position.y + y) * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });
  });
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
