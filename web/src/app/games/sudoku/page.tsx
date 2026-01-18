"use client";

export const dynamic = "force-dynamic";

import React from "react";
import SudokuGame from "gameshub/web/src/games/sudoku/ui";

export default function SudokuPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <SudokuGame />
    </main>
  );
}
