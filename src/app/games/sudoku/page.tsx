"use client";

import React, { useEffect, useState } from "react";
import SudokuBoard from "@/components/sudoku/SudokuBoard";
import { generate, type Difficulty, type Board } from "@/lib/sudoku/sudokuEngine";
import Link from "next/link";

export default function SudokuPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [puzzle, setPuzzle] = useState<Board | null>(null);
  const [solution, setSolution] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [clues, setClues] = useState<number | null>(null);

  function newPuzzle(d: Difficulty = difficulty) {
    setLoading(true);
    setTimeout(() => {
      const { puzzle: p, solution: s } = generate(d);
      setPuzzle(p);
      setSolution(s);
      // count non-empty cells as clues
      const filled = p.flat().filter(v => v !== 0).length;
      setClues(filled);
      setLoading(false);
    }, 50); // small timeout to avoid blocking UI
  }

  // regenerate immediately when difficulty changes (and on mount)
  useEffect(() => {
    newPuzzle(difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  return (
    <main className="min-h-screen p-6 flex flex-col items-center gap-6">
      <header className="w-full max-w-3xl flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sudoku</h1>
        <Link href="/" className="text-sm text-indigo-600">Back</Link>
      </header>

      <div className="w-full max-w-3xl flex flex-col items-center gap-4">
        <div className="flex gap-2 items-center">
          <label className="text-sm">Difficulty:</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="border rounded px-2 py-1">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button className="px-3 py-1 border rounded" onClick={() => newPuzzle(difficulty)}>New Puzzle</button>
          <span className="text-sm text-gray-600 dark:text-gray-300 ml-3">Clues: {clues ?? "—"}</span>
        </div>

        {loading && <div>Generating...</div>}

        {puzzle && solution && (
          <SudokuBoard initial={puzzle} solution={solution} />
        )}
      </div>
    </main>
  );
}
