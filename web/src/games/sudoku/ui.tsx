"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GameFrame } from "@/components/GameFrame";
import { Difficulty, SudokuBoard, flattenBoard, generateSudoku, isBoardComplete, isBoardCorrect } from "./engine";
import { getNumberColor, getNumberColorLight } from "./colors";

const MAX_HINTS = 3;

interface SudokuState {
  difficulty: Difficulty;
  game: SudokuBoard;
  board: number[];
  original: number[];
  selectedCell: number | null;
  hintsRemaining: number;
  won: boolean;
}

function createState(difficulty: Difficulty): SudokuState {
  const game = generateSudoku(difficulty);
  const puzzle = flattenBoard(game.puzzle);
  return {
    difficulty,
    game,
    board: [...puzzle],
    original: [...puzzle],
    selectedCell: null,
    hintsRemaining: MAX_HINTS,
    won: false,
  };
}

function hasConflict(board: number[], index: number): boolean {
  const value = board[index];
  if (value === 0) {
    return false;
  }

  const row = Math.floor(index / 9);
  const col = index % 9;

  for (let x = 0; x < 9; x += 1) {
    const rowIndex = row * 9 + x;
    if (rowIndex !== index && board[rowIndex] === value) {
      return true;
    }
  }

  for (let y = 0; y < 9; y += 1) {
    const colIndex = y * 9 + col;
    if (colIndex !== index && board[colIndex] === value) {
      return true;
    }
  }

  const boxStartRow = Math.floor(row / 3) * 3;
  const boxStartCol = Math.floor(col / 3) * 3;
  for (let y = boxStartRow; y < boxStartRow + 3; y += 1) {
    for (let x = boxStartCol; x < boxStartCol + 3; x += 1) {
      const boxIndex = y * 9 + x;
      if (boxIndex !== index && board[boxIndex] === value) {
        return true;
      }
    }
  }

  return false;
}

function isRelatedCell(source: number, target: number): boolean {
  const sourceRow = Math.floor(source / 9);
  const sourceCol = source % 9;
  const targetRow = Math.floor(target / 9);
  const targetCol = target % 9;

  if (sourceRow === targetRow || sourceCol === targetCol) {
    return true;
  }

  return Math.floor(sourceRow / 3) === Math.floor(targetRow / 3) && Math.floor(sourceCol / 3) === Math.floor(targetCol / 3);
}

export default function SudokuUI() {
  const [state, setState] = useState<SudokuState>(() => createState("easy"));
  const solution = useMemo(() => flattenBoard(state.game.solution), [state.game]);

  const startNewGame = useCallback((difficulty: Difficulty) => {
    setState(createState(difficulty));
  }, []);

  const applyValue = useCallback((index: number, value: number) => {
    setState((previous) => {
      if (previous.won || previous.original[index] !== 0) {
        return previous;
      }

      const board = [...previous.board];
      board[index] = value;
      const won = isBoardComplete(board) && isBoardCorrect(board, flattenBoard(previous.game.solution));

      return {
        ...previous,
        board,
        won,
      };
    });
  }, []);

  const clearBoard = useCallback(() => {
    setState((previous) => ({
      ...previous,
      board: [...previous.original],
      selectedCell: null,
      won: false,
    }));
  }, []);

  const useHint = useCallback(() => {
    setState((previous) => {
      if (
        previous.selectedCell === null ||
        previous.hintsRemaining <= 0 ||
        previous.original[previous.selectedCell] !== 0
      ) {
        return previous;
      }

      const board = [...previous.board];
      const nextValue = flattenBoard(previous.game.solution)[previous.selectedCell];
      board[previous.selectedCell] = nextValue;

      return {
        ...previous,
        board,
        hintsRemaining: previous.hintsRemaining - 1,
        won: isBoardComplete(board) && isBoardCorrect(board, flattenBoard(previous.game.solution)),
      };
    });
  }, []);

  const revealSolution = useCallback(() => {
    setState((previous) => ({
      ...previous,
      board: flattenBoard(previous.game.solution),
      won: true,
    }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        startNewGame(state.difficulty);
        return;
      }

      if (state.selectedCell === null) {
        return;
      }

      if (/^[1-9]$/.test(event.key)) {
        event.preventDefault();
        applyValue(state.selectedCell, Number(event.key));
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        applyValue(state.selectedCell, 0);
        return;
      }

      const row = Math.floor(state.selectedCell / 9);
      const col = state.selectedCell % 9;
      let nextCell = state.selectedCell;

      if (event.key === "ArrowUp" && row > 0) {
        nextCell -= 9;
      } else if (event.key === "ArrowDown" && row < 8) {
        nextCell += 9;
      } else if (event.key === "ArrowLeft" && col > 0) {
        nextCell -= 1;
      } else if (event.key === "ArrowRight" && col < 8) {
        nextCell += 1;
      } else {
        return;
      }

      event.preventDefault();
      setState((previous) => ({ ...previous, selectedCell: nextCell }));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [applyValue, startNewGame, state.difficulty, state.selectedCell]);

  return (
    <GameFrame
      title="Sudoku"
      subtitle="Fill each row, column, and box with digits 1-9."
      status={state.won ? "Solved" : `Difficulty ${state.difficulty}`}
      actions={
        <>
          <span className="chip">Hints {state.hintsRemaining}/{MAX_HINTS}</span>
          <button
            type="button"
            onClick={useHint}
            className="focus-ring rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]"
          >
            Hint
          </button>
          <button
            type="button"
            onClick={() => startNewGame(state.difficulty)}
            className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
          >
            Restart
          </button>
        </>
      }
      footer="Controls: Click cell, type 1-9, Backspace/Delete to clear, arrows to move, R to restart."
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="mx-auto grid max-w-[520px] grid-cols-9 gap-[2px] rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)] p-2">
            {state.board.map((value, index) => {
              const row = Math.floor(index / 9);
              const col = index % 9;
              const isFixed = state.original[index] !== 0;
              const selected = state.selectedCell === index;
              const related = state.selectedCell !== null && isRelatedCell(state.selectedCell, index);
              const wrong = !isFixed && value !== 0 && value !== solution[index];
              const conflict = value !== 0 && hasConflict(state.board, index);

              const baseColor = value ? getNumberColorLight(value) : "rgba(17, 30, 57, 0.65)";
              const textColor = value ? getNumberColor(value) : "var(--text-muted)";
              const borderTop = row % 3 === 0 ? "2px solid rgba(125, 211, 252, 0.8)" : "1px solid rgba(148, 163, 184, 0.16)";
              const borderLeft = col % 3 === 0 ? "2px solid rgba(125, 211, 252, 0.8)" : "1px solid rgba(148, 163, 184, 0.16)";

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setState((previous) => ({ ...previous, selectedCell: index }))}
                  disabled={state.won}
                  style={{
                    borderTop,
                    borderLeft,
                    borderRight: col === 8 ? "2px solid rgba(125, 211, 252, 0.8)" : undefined,
                    borderBottom: row === 8 ? "2px solid rgba(125, 211, 252, 0.8)" : undefined,
                    backgroundColor: selected
                      ? "color-mix(in srgb, var(--accent) 44%, white)"
                      : wrong || conflict
                      ? "rgba(244, 63, 94, 0.3)"
                      : related
                      ? "rgba(56, 189, 248, 0.18)"
                      : baseColor,
                    color: textColor,
                    fontWeight: isFixed ? 800 : 600,
                  }}
                  className="focus-ring flex aspect-square items-center justify-center rounded text-base transition sm:text-lg"
                >
                  {value || ""}
                </button>
              );
            })}
          </div>

          <div className="mx-auto grid max-w-[360px] grid-cols-3 gap-2">
            {Array.from({ length: 9 }, (_, index) => index + 1).map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => {
                  if (state.selectedCell !== null) {
                    applyValue(state.selectedCell, number);
                  }
                }}
                className="focus-ring rounded-xl border border-[var(--border-soft)] bg-[var(--surface-3)] py-3 text-lg font-black text-[var(--text-primary)]"
              >
                {number}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Difficulty</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["easy", "medium", "hard", "expert"] as const).map((difficulty) => (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => startNewGame(difficulty)}
                  className={`focus-ring rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${
                    state.difficulty === difficulty
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--border-soft)] bg-[var(--surface-3)] text-[var(--text-primary)]"
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (state.selectedCell !== null) {
                applyValue(state.selectedCell, 0);
              }
            }}
            className="focus-ring w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]"
          >
            Clear Selected Cell
          </button>
          <button
            type="button"
            onClick={clearBoard}
            className="focus-ring w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]"
          >
            Clear Player Inputs
          </button>
          <button
            type="button"
            onClick={revealSolution}
            className="focus-ring w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]"
          >
            Reveal Solution
          </button>
        </div>
      </div>
    </GameFrame>
  );
}
