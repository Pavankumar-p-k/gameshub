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

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPuzzle(flatPuzzle);
    setSolution(flatSolution);
    setBoard(flatPuzzle);
    setStatus("playing");
  }, [difficulty]);

  const handleCellChange = (index: number, value: string) => {
    if (puzzle[index] !== 0) return;

    const num = value === "" ? 0 : Number(value);
    if (Number.isNaN(num) || num < 0 || num > 9) return;

    const next = [...board];
    next[index] = num;
    setBoard(next);

    if (isBoardComplete(next)) {
      if (isBoardCorrect(next, solution)) {
        setStatus("won");
      } else {
        setStatus("error");
      }
    } else {
      setStatus("playing");
    }
  };

  const handleReset = () => {
    setBoard(puzzle);
    setStatus("playing");
  };

  const handleNewGame = (level: Difficulty) => {
    setDifficulty(level);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Sudoku</h1>

      <div className="flex gap-2">
        <button
          onClick={() => handleNewGame("easy")}
          className={`px-3 py-1 rounded ${
            difficulty === "easy" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Easy
        </button>
        <button
          onClick={() => handleNewGame("medium")}
          className={`px-3 py-1 rounded ${
            difficulty === "medium" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Medium
        </button>
        <button
          onClick={() => handleNewGame("hard")}
          className={`px-3 py-1 rounded ${
            difficulty === "hard" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Hard
        </button>
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(9, 2.5rem)",
          gridTemplateRows: "repeat(9, 2.5rem)",
          gap: "2px",
        }}
      >
        {board.map((value, index) => {
          const isGiven = puzzle[index] !== 0;
         const [row, col] = indexToRowCol(index);

          const isBoxBorderBottom = (row + 1) % 3 === 0 && row !== 8;
          const isBoxBorderRight = (col + 1) % 3 === 0 && col !== 8;

          return (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={value === 0 ? "" : value}
              onChange={(e) => handleCellChange(index, e.target.value)}
              readOnly={isGiven}
              className={`flex items-center justify-center text-center text-lg border ${
                isGiven ? "font-bold" : ""
              }`}
              style={{
                width: "2.5rem",
                height: "2.5rem",
                color: getNumberColor(value),
                backgroundColor: getNumberColorLight(value),
                borderBottomWidth: isBoxBorderBottom ? 2 : 1,
                borderRightWidth: isBoxBorderRight ? 2 : 1,
              }}
            />
          );
        })}
      </div>

      <div className="flex gap-3 items-center">
        <button
          onClick={handleReset}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
        >
          Reset
        </button>
        {status === "won" && (
          <span className="text-green-600 font-semibold">You solved it!</span>
        )}
        {status === "error" && (
          <span className="text-red-600 font-semibold">
            Some numbers are incorrect.
          </span>
        )}
      </div>
    </div>
  );
}

export default SudokuGame;
