"use client";

import React, { useEffect, useState } from "react";
import type { Board } from "@/lib/sudoku/sudokuEngine";
import { isValidMove, solve } from "@/lib/sudoku/sudokuEngine";

type Props = {
  initial: Board;
  solution?: Board;
};

export default function SudokuBoard({ initial, solution }: Props) {
  const [board, setBoard] = useState<Board>(() => initial.map(r => r.slice()));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [locked, setLocked] = useState<boolean[][]>(() => initial.map(r => r.map(v => v !== 0)));
  const [message, setMessage] = useState<string | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState<number>(5); // new: remaining hints (limit to 5 per puzzle)

  // invalid line tracking
  const [invalidRows, setInvalidRows] = useState<boolean[]>(() => Array(9).fill(false));
  const [invalidCols, setInvalidCols] = useState<boolean[]>(() => Array(9).fill(false));
  const [invalidBoxes, setInvalidBoxes] = useState<boolean[]>(() => Array(9).fill(false));

  // per-number color classes
  const numberColors: Record<number, string> = {
    1: "text-red-600 dark:text-red-300",
    2: "text-orange-500 dark:text-orange-300",
    3: "text-yellow-600 dark:text-yellow-300",
    4: "text-green-600 dark:text-green-300",
    5: "text-teal-600 dark:text-teal-300",
    6: "text-blue-600 dark:text-blue-300",
    7: "text-indigo-600 dark:text-indigo-300",
    8: "text-purple-600 dark:text-purple-300",
    9: "text-pink-600 dark:text-pink-300",
  };

  // shared button styles to highlight controls around the table
  const btnBase = "px-3 py-1 rounded shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1";
  const btnPrimary = "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:ring-indigo-400 dark:focus:ring-indigo-300";
  const btnNeutral = "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-300";
  const btnDisabled = "disabled:opacity-50 disabled:cursor-not-allowed";

  // detect invalid rows/cols/boxes (duplicate numbers)
  useEffect(() => {
    const rows = Array(9).fill(false);
    const cols = Array(9).fill(false);
    const boxes = Array(9).fill(false);

    // rows
    for (let r = 0; r < 9; r++) {
      const counts = new Map<number, number>();
      for (let c = 0; c < 9; c++) {
        const v = board[r][c];
        if (!v) continue;
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      for (const cnt of counts.values()) {
        if (cnt > 1) {
          rows[r] = true;
          break;
        }
      }
    }

    // cols
    for (let c = 0; c < 9; c++) {
      const counts = new Map<number, number>();
      for (let r = 0; r < 9; r++) {
        const v = board[r][c];
        if (!v) continue;
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      for (const cnt of counts.values()) {
        if (cnt > 1) {
          cols[c] = true;
          break;
        }
      }
    }

    // boxes
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const counts = new Map<number, number>();
        const bi = br * 3 + bc;
        for (let r = br * 3; r < br * 3 + 3; r++) {
          for (let c = bc * 3; c < bc * 3 + 3; c++) {
            const v = board[r][c];
            if (!v) continue;
            counts.set(v, (counts.get(v) ?? 0) + 1);
          }
        }
        for (const cnt of counts.values()) {
          if (cnt > 1) {
            boxes[bi] = true;
            break;
          }
        }
      }
    }

    setInvalidRows(rows);
    setInvalidCols(cols);
    setInvalidBoxes(boxes);
  }, [board]);

  useEffect(() => {
    setBoard(initial.map(r => r.slice()));
    setLocked(initial.map(r => r.map(v => v !== 0)));
    setSelected(null);
    setMessage(null);
    setHintsRemaining(5); // reset hints on new puzzle
  }, [initial]);

  function setCell(r: number, c: number, val: number) {
    if (locked[r][c]) return;
    setBoard(prev => {
      const next = prev.map(row => row.slice());
      next[r][c] = val;
      return next;
    });
  }

  function handleNumber(n: number) {
    if (!selected) return;
    const [r,c] = selected;
    if (n === 0) {
      setCell(r,c,0);
      return;
    }
    if (isValidMove(board, r, c, n)) {
      setCell(r,c,n);
      setMessage(null);
    } else {
      setMessage("Invalid move");
      // still allow setting (optional): comment out if you want to prevent incorrect entries
      setCell(r,c,n);
    }
  }

  function checkSolved() {
    if (!solution) {
      // try to solve the current board and check full
      const cpy = board.map(r => r.slice());
      if (solve(cpy)) {
        setMessage("Solved!");
      } else {
        setMessage("Not solved yet.");
      }
      return;
    }
    const equal = board.every((r, i) => r.every((v, j) => v === solution[i][j]));
    setMessage(equal ? "Congratulations! Puzzle complete." : "Incorrect / incomplete.");
  }

  function hint() {
    // reveal one empty cell from solution if available, limited uses
    if (!solution) {
      setMessage("No solution available for hints.");
      return;
    }
    if (hintsRemaining <= 0) {
      setMessage("No hints remaining.");
      return;
    }
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          setCell(r, c, solution[r][c]);
          const newRemaining = hintsRemaining - 1;
          setHintsRemaining(newRemaining);
          setMessage(`Hint used. ${newRemaining} hints left.`);
           return;
        }
      }
    }
    setMessage("No empty cells to hint.");
  }

  function revealSolution() {
    if (!solution) {
      setMessage("No solution available.");
      return;
    }
    const ok = typeof window !== "undefined" ? window.confirm("Reveal the solution? This will mark the puzzle as given up. Continue?") : true;
    if (!ok) return;
    setBoard(solution.map(r => r.slice()));
    setMessage("Solution revealed — you gave up.");
  }

  function onreset() {
    setBoard(initial.map(r => r.slice()));
    setLocked(initial.map(r => r.map(v => v !== 0)));
    setSelected(null);
    setMessage(null);
    setHintsRemaining(5);
  }

  // keyboard handlers
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selected) {
        // allow arrows to start selection at 0,0
        if (e.key.startsWith("Arrow")) {
          setSelected([0, 0]);
          e.preventDefault();
        }
        return;
      }
      const [r, c] = selected;
      switch (e.key) {
        case "ArrowUp":
          setSelected([(r + 8) % 9, c]); e.preventDefault(); break;
        case "ArrowDown":
          setSelected([(r + 1) % 9, c]); e.preventDefault(); break;
        case "ArrowLeft":
          setSelected([r, (c + 8) % 9]); e.preventDefault(); break;
        case "ArrowRight":
          setSelected([r, (c + 1) % 9]); e.preventDefault(); break;
        case "Backspace":
        case "Delete":
          handleNumber(0); e.preventDefault(); break;
        case "Enter":
          checkSolved(); e.preventDefault(); break;
        case "Escape":
          setSelected(null); e.preventDefault(); break;
        default: {
          if (/^[1-9]$/.test(e.key)) {
            handleNumber(Number(e.key));
            e.preventDefault();
          }
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, board, hintsRemaining]); // include dependencies used by handler

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-9 gap-0 border-2 border-gray-400 dark:border-gray-600 rounded-sm overflow-hidden">
        {board.map((row, r) =>
          row.map((val, c) => {
            const isLocked = locked[r][c];
            const isSelected = selected && selected[0] === r && selected[1] === c;
            const boxIndex = Math.floor(r / 3) * 3 + Math.floor(c / 3);
            const isInvalidLine = invalidRows[r] || invalidCols[c] || invalidBoxes[boxIndex];
            const numClass = val !== 0 ? numberColors[val] : "";
            const bgClass = isInvalidLine ? "bg-red-100 dark:bg-red-900" : (isSelected ? "bg-indigo-100 dark:bg-indigo-800" : "");
            const rightSep = (c % 3 === 2 && c !== 8) ? "border-r-4 border-gray-600 dark:border-gray-300" : "";
            const bottomSep = (r % 3 === 2 && r !== 8) ? "border-b-4 border-gray-600 dark:border-gray-300" : "";
            const borderClasses = [
              "w-10 h-10 flex items-center justify-center cursor-pointer select-none",
              "border border-gray-300 dark:border-gray-700",
              rightSep,
              bottomSep,
              bgClass,
              isLocked ? "font-bold" : "",
            ].join(" ");
            const textClasses = [
              val === 0 ? (isLocked ? "text-gray-800 dark:text-gray-200" : "text-gray-700 dark:text-gray-300") : numClass
            ].join(" ");
            return (
              <div
                key={`${r}-${c}`}
                className={borderClasses}
                onClick={() => setSelected([r,c])}
                role="button"
                aria-label={`cell-${r}-${c}`}
              >
                <span className={textClasses}>{val === 0 ? "" : val}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2 flex-wrap justify-center p-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button
            key={n}
            className={`${btnBase} ${btnNeutral} ${btnDisabled}`}
            onClick={() => handleNumber(n)}
            aria-label={`number-${n}`}
          >
            {n}
          </button>
        ))}
        <button className={`${btnBase} ${btnNeutral}`} onClick={() => handleNumber(0)} aria-label="clear">Clear</button>
      </div>

      <div className="flex gap-2 items-center p-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <button
          className={`${btnBase} ${btnPrimary} ${btnDisabled}`}
          onClick={hint}
          disabled={hintsRemaining <= 0}
          title={hintsRemaining > 0 ? `Use a hint (${hintsRemaining} left)` : "No hints left"}
        >
          Hint
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-300">Hints: {hintsRemaining}</span>
        <button className={`${btnBase} ${btnNeutral}`} onClick={checkSolved}>Check</button>
        <button className={`${btnBase} ${btnNeutral}`} onClick={revealSolution}>Reveal</button>
        <button className={`${btnBase} ${btnNeutral}`} onClick={onreset}>Reset</button>
      </div>

      {message && <div className="text-sm text-gray-700 dark:text-gray-200">{message}</div>}
    </div>
  );
}
