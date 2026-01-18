"use client";

import React, { useEffect, useState } from "react";
import {
  Difficulty,
  generateSudoku,
  flattenBoard,
  indexToRowCol,
  isBoardComplete,
  isBoardCorrect,
} from "./engine";
import { getNumberColor, getNumberColorLight } from "./colors";

export function SudokuGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [puzzle, setPuzzle] = useState<number[]>([]);
  const [solution, setSolution] = useState<number[]>([]);
  const [board, setBoard] = useState<number[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "error">("playing");

  useEffect(() => {
    const { puzzle, solution } = generateSudoku(difficulty);
    const flatPuzzle = flattenBoard(puzzle);
    const flatSolution = flattenBoard(solution);
    setPuzzle(flatPuzzle);
    setSolution(flatSolution);
    setBoard(flatPuzzle);
    setStatus("playing");
  }, [difficulty]);

  const handleCellChange = (index: number, value: string) => {
    if (puzzle[index] !== 0) return;

    const num = Number(value) || 0;
    if (num < 0 || num > 9) return;

    const next = [...board];
    next[index] = num;
    setBoard(next);

    if (isBoardComplete(next)) {
      setStatus(isBoardCorrect(next, solution) ? "won" : "error");
    } else {
      setStatus("playing");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Difficulty:</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="rounded border border-gray-600 bg-neutral-900 px-2 py-1 text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        {status === "won" && (
          <span className="text-sm font-semibold text-emerald-400">
            You solved the puzzle!
          </span>
        )}

        {status === "error" && (
          <span className="text-sm font-semibold text-red-400">
            Some numbers are incorrect.
          </span>
        )}
      </div>

      <div className="grid grid-cols-9 gap-[2px] bg-neutral-800 p-[2px] rounded-lg">
        {board.map((value, index) => {
          const [row, col] = indexToRowCol(index);
          const isPrefilled = puzzle[index] !== 0;
          const displayValue = value === 0 ? "" : String(value);
          const color =
            value > 0 ? getNumberColor(value) : "rgba(255,255,255,0.8)";
          const bg =
            value > 0 ? getNumberColorLight(value) : "rgba(0,0,0,0.8)";
          const borderClasses = [
            row % 3 === 0 ? "border-t-2 border-neutral-700" : "",
            col % 3 === 0 ? "border-l-2 border-neutral-700" : "",
          ].join(" ");

          return (
            <div
              key={index}
              className={`relative aspect-square ${borderClasses}`}
            >
              <input
                value={displayValue}
                onChange={(e) => handleCellChange(index, e.target.value)}
                className={`w-full h-full text-center text-lg font-semibold outline-none ${
                  isPrefilled ? "cursor-default" : "cursor-text"
                }`}
                style={{
                  color: isPrefilled ? "#fff" : color,
                  backgroundColor: isPrefilled ? "#111827" : bg,
                }}
                disabled={isPrefilled}
                inputMode="numeric"
                maxLength={1}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
