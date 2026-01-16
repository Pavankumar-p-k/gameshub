"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  generateSudoku,
  flattenBoard,
  indexToRowCol,
  rowColToIndex,
  isBoardComplete,
  isBoardCorrect,
  type Difficulty,
  type SudokuBoard,
} from "./engine";
import { isValidPlacement } from "./validator";
import { getNumberColor, getNumberColorLight } from "./colors";

const GRID_SIZE = 9;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const MAX_HINTS = 3;

export default function SudokuUI() {
  const [game, setGame] = useState<SudokuBoard | null>(null);
  const [board, setBoard] = useState<number[]>(Array(TOTAL_CELLS).fill(0));
  const [original, setOriginal] = useState<number[]>(
    Array(TOTAL_CELLS).fill(0)
  );
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState(MAX_HINTS);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize game
  const startNewGame = useCallback((newDifficulty: Difficulty) => {
    const newGame = generateSudoku(newDifficulty);
    const puzzle = flattenBoard(newGame.puzzle);

    setGame(newGame);
    setBoard(puzzle.map((x) => x));
    setOriginal(puzzle.map((x) => x));
    setSelectedCell(null);
    setHintsRemaining(MAX_HINTS);
    setDifficulty(newDifficulty);
    setGameWon(false);
    setGameStarted(true);
  }, []);

  // Initialize on mount
  useEffect(() => {
    startNewGame("easy");
  }, [startNewGame]);

  // Handle cell input
  const handleCellChange = (index: number, value: string) => {
    if (original[index] !== 0) return; // Can't modify original clues

    let numValue = 0;
    if (value !== "") {
      if (!/^[1-9]$/.test(value)) return;
      numValue = parseInt(value, 10);
    }

    const newBoard = [...board];
    newBoard[index] = numValue;
    setBoard(newBoard);

    // Check if won
    if (
      isBoardComplete(newBoard) &&
      isBoardCorrect(newBoard, flattenBoard(game!.solution))
    ) {
      setGameWon(true);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || selectedCell === null) return;

      const key = e.key;

      // Number keys 1-9
      if (/^[1-9]$/.test(key)) {
        e.preventDefault();
        handleCellChange(selectedCell, key);
      }

      // Delete or Backspace
      if (key === "Delete" || key === "Backspace") {
        e.preventDefault();
        handleCellChange(selectedCell, "");
      }

      // Arrow keys for navigation
      const row = Math.floor(selectedCell / GRID_SIZE);
      const col = selectedCell % GRID_SIZE;
      let newIndex = selectedCell;

      if (key === "ArrowUp" && row > 0) {
        newIndex = selectedCell - GRID_SIZE;
      } else if (key === "ArrowDown" && row < GRID_SIZE - 1) {
        newIndex = selectedCell + GRID_SIZE;
      } else if (key === "ArrowLeft" && col > 0) {
        newIndex = selectedCell - 1;
      } else if (key === "ArrowRight" && col < GRID_SIZE - 1) {
        newIndex = selectedCell + 1;
      }

      if (newIndex !== selectedCell) {
        e.preventDefault();
        setSelectedCell(newIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, gameStarted]);

  // Use a hint
  const useHint = () => {
    if (hintsRemaining <= 0 || selectedCell === null) return;
    if (original[selectedCell] !== 0) return; // Can't hint on clues

    const solution = flattenBoard(game!.solution);
    const newBoard = [...board];
    newBoard[selectedCell] = solution[selectedCell];
    setBoard(newBoard);
    setHintsRemaining(hintsRemaining - 1);
  };

  // Clear board
  const clearBoard = () => {
    setBoard(original.map((x) => x));
    setGameWon(false);
  };

  // Reveal solution
  const revealSolution = () => {
    if (confirm("Are you sure? This will end the game.")) {
      const solution = flattenBoard(game!.solution);
      setBoard(solution);
      setGameWon(true);
    }
  };

  // Check if a cell has a conflict with other cells
  const hasConflict = (index: number): boolean => {
    if (board[index] === 0) return false;

    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const value = board[index];

    // Check row
    for (let c = 0; c < GRID_SIZE; c++) {
      const i = row * GRID_SIZE + c;
      if (i !== index && board[i] === value) {
        return true;
      }
    }

    // Check column
    for (let r = 0; r < GRID_SIZE; r++) {
      const i = r * GRID_SIZE + col;
      if (i !== index && board[i] === value) {
        return true;
      }
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        const i = r * GRID_SIZE + c;
        if (i !== index && board[i] === value) {
          return true;
        }
      }
    }

    return false;
  };

  // Check if a cell's value is incorrect compared to solution
  const isWrongMove = (index: number): boolean => {
    if (board[index] === 0) return false;
    if (original[index] !== 0) return false; // Original clues can't be wrong

    return board[index] !== solution[index];
  };

  // Get highlight color for related cells
  const getHighlightColor = (index: number): string | null => {
    if (!selectedCell) return null;

    const selectedRow = Math.floor(selectedCell / GRID_SIZE);
    const selectedCol = selectedCell % GRID_SIZE;
    const currentRow = Math.floor(index / GRID_SIZE);
    const currentCol = index % GRID_SIZE;

    // Same row or column
    if (selectedRow === currentRow || selectedCol === currentCol) {
      return "bg-blue-100";
    }

    // Same 3x3 box
    const selectedBox =
      Math.floor(selectedRow / 3) * 3 + Math.floor(selectedCol / 3);
    const currentBox =
      Math.floor(currentRow / 3) * 3 + Math.floor(currentCol / 3);
    if (selectedBox === currentBox) {
      return "bg-blue-100";
    }

    return null;
  };

  if (!game) return <div>Loading...</div>;

  const solution = flattenBoard(game.solution);
  const boardDisplay = board.map((val) => (val === 0 ? "" : val.toString()));

  return (
    <div className="flex flex-col items-center gap-4 md:gap-6 p-3 md:p-6 min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-black text-center bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-1 md:mb-2">
          SUDOKU
        </h1>
        <p className="text-center text-gray-300 text-sm md:text-base">
          Difficulty:{" "}
          <span className="font-bold capitalize text-cyan-400">{difficulty}</span>
        </p>
      </div>

      {gameWon && (
        <div className="w-full max-w-4xl bg-gradient-to-r from-green-500 to-emerald-500 border-2 border-green-300 text-white px-4 py-3 md:px-4 md:py-4 rounded-lg font-bold text-base md:text-lg shadow-lg">
          🎉 Congratulations! You solved it!
        </div>
      )}

      {/* Game Grid - Responsive */}
      <div className="bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 p-1 md:p-2 rounded-lg shadow-2xl border-4 border-cyan-400" style={{ boxShadow: "0 0 30px rgba(34, 211, 238, 0.5)" }}>
        <div className="grid gap-[1px] bg-gray-950 rounded-md overflow-hidden" style={{ gridTemplateColumns: "repeat(9, 1fr)" }}>
          {boardDisplay.map((cell, i) => {
            const [row, col] = indexToRowCol(i);
            const isOriginal = original[i] !== 0;
            const isSelected = selectedCell === i;
            const highlightColor = getHighlightColor(i);
            const wrong = isWrongMove(i);
            const conflict = hasConflict(i);

            // Cell borders for 3x3 boxes
            const borderStyle = {
              borderTop:
                row % 3 === 0 ? "4px solid rgba(6, 182, 212, 1)" : "1px solid rgb(55, 65, 81)",
              borderLeft:
                col % 3 === 0 ? "4px solid rgba(6, 182, 212, 1)" : "1px solid rgb(55, 65, 81)",
              borderRight:
                col === 8 ? "4px solid rgba(6, 182, 212, 1)" : undefined,
              borderBottom:
                row === 8 ? "4px solid rgba(6, 182, 212, 1)" : undefined,
              boxShadow: (row % 3 === 0 || col % 3 === 0) && row % 3 !== 0 && col % 3 !== 0 ? "inset 0 0 8px rgba(6, 182, 212, 0.3)" : undefined,
            };

            const cellValue = board[i];
            const textColor = cellValue ? getNumberColor(cellValue) : "rgb(107, 114, 128)";
            
            let bgColor = "rgb(17, 24, 39)";
            if (wrong || conflict) {
              bgColor = "#7F1D1D"; // Dark red for wrong moves
            } else if (cellValue && !isOriginal) {
              bgColor = getNumberColorLight(cellValue);
            }

            return (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={cell}
                onChange={(e) => handleCellChange(i, e.target.value)}
                onFocus={() => setSelectedCell(i)}
                disabled={isOriginal || gameWon}
                placeholder=""
                title={`Sudoku cell ${i + 1}`}
                aria-label={`Sudoku cell at position ${i + 1}`}
                style={{
                  ...borderStyle,
                  color: textColor,
                  backgroundColor: isSelected
                    ? "#FF6B00"
                    : wrong || conflict
                      ? "#7F1D1D"
                      : highlightColor
                      ? "#4A5F8F"
                      : bgColor,
                  fontWeight: isOriginal ? "bold" : "600",
                  cursor: isOriginal ? "not-allowed" : "text",
                  border: (wrong || conflict) ? "2px solid #DC2626" : undefined,
                  boxShadow: isSelected ? "0 0 15px rgba(255, 107, 0, 0.6)" : (wrong || conflict) ? "inset 0 0 10px rgba(220, 38, 38, 0.3)" : "",
                }}
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12
                  text-center
                  text-xs sm:text-sm md:text-lg font-bold
                  focus:outline-none
                  focus:ring-2
                  focus:ring-yellow-400
                  transition-all duration-100
                `}
              />
            );
          })}
        </div>
      </div>

      {/* Main Control and Info Container - Responsive Grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left: Number Pad */}
        <div className="lg:col-span-1 bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 border-2 border-blue-500">
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-cyan-400">Number Pad</h2>

          {/* Number Pad Grid */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => {
                  if (selectedCell !== null) {
                    handleCellChange(selectedCell, num.toString());
                  }
                }}
                disabled={selectedCell === null || original[selectedCell] !== 0}
                style={{
                  backgroundColor: getNumberColorLight(num),
                  borderColor: getNumberColor(num),
                  color: getNumberColor(num),
                }}
                className="py-3 md:py-4 px-2 md:px-3 border-2 font-black text-sm md:text-base rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-md hover:shadow-lg"
              >
                {num}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 mt-4 md:mt-6">
            <button
              onClick={() => handleCellChange(selectedCell || 0, "")}
              disabled={selectedCell === null || original[selectedCell || 0] !== 0}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 md:py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm md:text-base"
            >
              Clear Cell
            </button>

            <button
              onClick={useHint}
              disabled={
                selectedCell === null ||
                hintsRemaining === 0 ||
                original[selectedCell] !== 0
              }
              className={`w-full ${
                hintsRemaining > 0
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                  : "from-gray-600 to-gray-700"
              } disabled:cursor-not-allowed text-white font-bold py-2 md:py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm md:text-base`}
            >
              Hint ({hintsRemaining}/{MAX_HINTS})
            </button>

            <button
              onClick={clearBoard}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 md:py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm md:text-base"
            >
              Clear Board
            </button>

            <button
              onClick={revealSolution}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-2 md:py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm md:text-base"
            >
              Reveal Solution
            </button>
          </div>
        </div>

        {/* Center: Game Stats & Difficulty */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          {/* Game Stats */}
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg border-2 border-green-500">
            <h3 className="text-base md:text-lg font-bold mb-3 text-green-400">
              Game Stats
            </h3>
            <div className="space-y-2">
              <p className="text-sm md:text-base text-gray-300">
                Hints: <span className="font-bold text-yellow-400">{hintsRemaining}/{MAX_HINTS}</span>
              </p>
              <p className="text-sm md:text-base text-gray-300">
                Difficulty: <span className="font-bold text-cyan-400 capitalize">{difficulty}</span>
              </p>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 border-2 border-green-500">
            <h2 className="text-base md:text-lg font-bold mb-3 text-green-400">
              New Game
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {(["easy", "medium", "hard", "expert"] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => startNewGame(diff)}
                  className={`py-2 px-3 md:py-3 md:px-4 rounded font-bold capitalize transition-all text-xs md:text-sm ${
                    difficulty === diff
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Legend */}
        <div className="lg:col-span-1 bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 border-2 border-purple-500">
          <h3 className="font-bold mb-3 md:mb-4 text-lg md:text-lg text-purple-400">
            Controls
          </h3>
          <ul className="text-xs md:text-sm text-gray-300 space-y-2 md:space-y-3">
            <li>
              <strong className="text-blue-400">Click</strong> - Select cell
            </li>
            <li>
              <strong className="text-blue-400">1-9</strong> - Enter numbers
            </li>
            <li>
              <strong className="text-blue-400">Delete/Backspace</strong> - Clear
            </li>
            <li>
              <strong className="text-blue-400">Arrow Keys</strong> - Navigate
            </li>
            <li>
              <strong className="text-slate-400">🟦 Blue</strong> - Related cells
            </li>
            <li>
              <strong className="text-orange-400">🟧 Orange</strong> - Selected
            </li>
            <li className="pt-2">
              <strong className="text-yellow-400">✓ Desktop</strong> - Full keyboard
            </li>
            <li>
              <strong className="text-yellow-400">✓ Mobile</strong> - Touch pad
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
