"use client";

import React, { useState } from "react";
import { isValidPlacement } from "./validator";

const GRID_SIZE = 9;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

export default function SudokuUI() {
  const [board, setBoard] = useState<string[]>(
    Array(TOTAL_CELLS).fill("")
  );

  function handleChange(index: number, value: string) {
    if (value === "" || /^[1-9]$/.test(value)) {
      const newBoard = [...board];
      newBoard[index] = value;
      setBoard(newBoard);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">BAHUBALI</h1>

      <div className="grid grid-cols-9 gap-[2px] border-2 border-black">
        {board.map((cell, i) => {
          const isValid = isValidPlacement(board, i, cell);

          return (
            <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={cell}
                  onChange={(e) => handleChange(i, e.target.value)}
                  placeholder="0"
                  title={`Sudoku cell ${i + 1}. Enter a number 1-9`}
                  aria-label={`Sudoku cell at position ${i + 1}`}
                 className={`
                 w-10 h-10
                 text-center
                 border
                 text-lg font-semibold
                 focus:outline-none
                 ${isValid ? "border-gray-400" : "border-red-500 bg-red-100"}
            `}
            />
          );
        })}
      </div>
    </div>
  );
}
