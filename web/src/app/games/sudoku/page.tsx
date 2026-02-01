"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import SudokuUI from "../../../components/games/sudoku/ui";
import { saveGameProgress } from "@/lib/gameService";

export default function SudokuPage() {
  const [score, setScore] = useState(0);
  const [isAuthed, setIsAuthed] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for auth token or guest flag
        const guestMode = localStorage.getItem("guest") === "true";
        setIsAuthed(!guestMode);
      } catch (e) {
        console.error("Error checking auth:", e);
      }
    };
    checkAuth();
  }, []);

  // Save game progress when score changes
  const handleScoreChange = async (newScore: number) => {
    setScore(newScore);

    // Save progress to database
    try {
      const result = await saveGameProgress(
        {
          gameName: "Sudoku",
          score: newScore,
          status: "playing",
          level: 1,
        },
        undefined,
        localStorage.getItem("guest_id") || undefined
      );

      if (!result.success) {
        console.warn("Failed to save game progress:", result.error);
      }
    } catch (e) {
      console.error("Error saving game progress:", e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black text-white">
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Sudoku</h1>
          <div className="text-xl">Score: {score}</div>
        </div>
        <SudokuUI onScoreChange={handleScoreChange} />
        {isAuthed && (
          <p className="mt-4 text-sm text-gray-400">
            Your progress is being saved automatically.
          </p>
        )}
      </div>
    </div>
  );
}
