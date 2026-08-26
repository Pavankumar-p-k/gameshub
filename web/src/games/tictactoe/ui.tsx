"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GameFrame } from "@/components/GameFrame";

type Player = "X" | "O";
type Outcome = Player | "Draw" | null;

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

function checkOutcome(board: string[]): Outcome {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a] as Player;
    }
  }

  if (board.every(Boolean)) {
    return "Draw";
  }

  return null;
}

export function TicTacToeGame() {
  const [board, setBoard] = useState<string[]>(Array(9).fill(""));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [outcome, setOutcome] = useState<Outcome>(null);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(""));
    setCurrentPlayer("X");
    setOutcome(null);
  }, []);

  const makeMove = useCallback(
    (index: number) => {
      if (board[index] || outcome) {
        return;
      }

      const nextBoard = [...board];
      nextBoard[index] = currentPlayer;
      const nextOutcome = checkOutcome(nextBoard);

      setBoard(nextBoard);
      setOutcome(nextOutcome);
      if (!nextOutcome) {
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
    },
    [board, currentPlayer, outcome]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key >= "1" && event.key <= "9") {
        event.preventDefault();
        makeMove(Number(event.key) - 1);
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [makeMove, resetGame]);

  const statusLabel = useMemo(() => {
    if (!outcome) {
      return `Turn ${currentPlayer}`;
    }
    if (outcome === "Draw") {
      return "Draw";
    }
    return `${outcome} Wins`;
  }, [currentPlayer, outcome]);

  return (
    <GameFrame
      title="Tic Tac Toe"
      subtitle="Classic 3x3 tactical duel."
      status={statusLabel}
      actions={
        <>
          <span className="chip">Player X vs O</span>
          <button
            type="button"
            onClick={resetGame}
            className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
          >
            New Round
          </button>
        </>
      }
      score={outcome === "X" ? 100 : outcome === "O" ? 50 : 0}
      gameOver={outcome !== null && outcome !== "X" && outcome !== "O" ? true : outcome !== null}
      footer="Controls: Click a tile or press 1-9. Press R to reset."
    >
      <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-2">
        {board.map((cell, index) => (
          <button
            key={index}
            type="button"
            onClick={() => makeMove(index)}
            className="focus-ring flex aspect-square items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-4xl font-black text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
          >
            {cell || index + 1}
          </button>
        ))}
      </div>
    </GameFrame>
  );
}

export default TicTacToeGame;
