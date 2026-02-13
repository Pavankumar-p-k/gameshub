"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GameFrame } from "@/components/GameFrame";

const SIZE = 10;
const MINES = 14;

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

interface MinesweeperState {
  board: Cell[][];
  gameOver: boolean;
  won: boolean;
}

function createCell(): Cell {
  return {
    isMine: false,
    isRevealed: false,
    isFlagged: false,
    neighborMines: 0,
  };
}

function createBoard(): Cell[][] {
  const board = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => createCell()));

  let minesPlaced = 0;
  while (minesPlaced < MINES) {
    const x = Math.floor(Math.random() * SIZE);
    const y = Math.floor(Math.random() * SIZE);
    if (board[y][x].isMine) {
      continue;
    }
    board[y][x].isMine = true;
    minesPlaced += 1;
  }

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (board[y][x].isMine) {
        continue;
      }

      let count = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) {
            continue;
          }
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && board[ny][nx].isMine) {
            count += 1;
          }
        }
      }
      board[y][x].neighborMines = count;
    }
  }

  return board;
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function createInitialState(): MinesweeperState {
  return {
    board: createBoard(),
    gameOver: false,
    won: false,
  };
}

function revealFrom(board: Cell[][], startX: number, startY: number) {
  const queue: Array<[number, number]> = [[startX, startY]];

  while (queue.length > 0) {
    const [x, y] = queue.shift() as [number, number];
    const cell = board[y][x];

    if (cell.isRevealed || cell.isFlagged) {
      continue;
    }

    cell.isRevealed = true;
    if (cell.neighborMines !== 0 || cell.isMine) {
      continue;
    }

    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) {
          continue;
        }
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && !board[ny][nx].isRevealed) {
          queue.push([nx, ny]);
        }
      }
    }
  }
}

function revealCell(state: MinesweeperState, x: number, y: number): MinesweeperState {
  if (state.gameOver) {
    return state;
  }

  const board = cloneBoard(state.board);
  const cell = board[y][x];

  if (cell.isFlagged || cell.isRevealed) {
    return state;
  }

  if (cell.isMine) {
    board.forEach((row) => {
      row.forEach((boardCell) => {
        if (boardCell.isMine) {
          boardCell.isRevealed = true;
        }
      });
    });
    return { board, gameOver: true, won: false };
  }

  revealFrom(board, x, y);

  const safeCellsRemaining = board.some((row) =>
    row.some((boardCell) => !boardCell.isMine && !boardCell.isRevealed)
  );

  const won = !safeCellsRemaining;
  return { board, gameOver: won, won };
}

function toggleFlag(state: MinesweeperState, x: number, y: number): MinesweeperState {
  if (state.gameOver) {
    return state;
  }

  const board = cloneBoard(state.board);
  const cell = board[y][x];
  if (cell.isRevealed) {
    return state;
  }

  cell.isFlagged = !cell.isFlagged;
  return { ...state, board };
}

function neighborColor(count: number): string {
  const colors = [
    "text-slate-300",
    "text-sky-300",
    "text-emerald-300",
    "text-amber-300",
    "text-orange-300",
    "text-rose-300",
    "text-fuchsia-300",
    "text-cyan-200",
    "text-red-100",
  ];
  return colors[count] ?? "text-slate-200";
}

export function MinesweeperGame() {
  const [state, setState] = useState<MinesweeperState>(createInitialState);

  const resetGame = useCallback(() => {
    setState(createInitialState());
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetGame]);

  const flagCount = useMemo(
    () => state.board.flat().filter((cell) => cell.isFlagged).length,
    [state.board]
  );

  return (
    <GameFrame
      title="Minesweeper"
      subtitle="Reveal every safe tile without hitting a mine."
      status={state.gameOver ? (state.won ? "Field Cleared" : "Mine Triggered") : "Scanning"}
      actions={
        <>
          <span className="chip">Mines {MINES}</span>
          <span className="chip">Flags {flagCount}</span>
          <button
            type="button"
            onClick={resetGame}
            className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
          >
            New Board
          </button>
        </>
      }
      footer="Controls: Left click/tap to reveal. Right click to flag. Press R to restart."
    >
      <div className="mx-auto w-full max-w-[520px]">
        <div className="grid grid-cols-10 gap-1">
          {state.board.flat().map((cell, index) => {
            const x = index % SIZE;
            const y = Math.floor(index / SIZE);

            return (
              <button
                key={index}
                type="button"
                onClick={() => setState((previous) => revealCell(previous, x, y))}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setState((previous) => toggleFlag(previous, x, y));
                }}
                className={`focus-ring flex aspect-square items-center justify-center rounded border text-sm font-bold ${
                  cell.isRevealed
                    ? cell.isMine
                      ? "border-rose-400 bg-rose-500/80 text-white"
                    : "border-[var(--border-soft)] bg-[var(--surface-2)]"
                    : cell.isFlagged
                    ? "border-amber-400 bg-amber-500/70 text-white"
                    : "border-[var(--border-soft)] bg-[var(--surface-3)] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                }`}
              >
                {cell.isRevealed ? (
                  cell.isMine ? (
                    "*"
                  ) : cell.neighborMines ? (
                    <span className={neighborColor(cell.neighborMines)}>{cell.neighborMines}</span>
                  ) : (
                    ""
                  )
                ) : cell.isFlagged ? (
                  "F"
                ) : (
                  ""
                )}
              </button>
            );
          })}
        </div>
      </div>
    </GameFrame>
  );
}

export default MinesweeperGame;
