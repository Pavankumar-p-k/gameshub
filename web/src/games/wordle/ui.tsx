"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GameFrame } from "@/components/GameFrame";

const WORD_BANK = [
  "apple",
  "angle",
  "baker",
  "crane",
  "doubt",
  "eagle",
  "flame",
  "grape",
  "house",
  "joker",
  "knock",
  "lemon",
  "mango",
  "noble",
  "ocean",
  "peach",
  "quick",
  "raven",
  "stone",
  "tiger",
] as const;

type LetterStatus = "correct" | "present" | "absent";

function randomWord(): string {
  return WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
}

function evaluateGuess(target: string, guess: string): LetterStatus[] {
  const statuses: LetterStatus[] = Array(5).fill("absent");
  const leftoverCounts = new Map<string, number>();

  for (let index = 0; index < 5; index += 1) {
    const targetLetter = target[index];
    const guessLetter = guess[index];
    if (targetLetter === guessLetter) {
      statuses[index] = "correct";
    } else {
      leftoverCounts.set(targetLetter, (leftoverCounts.get(targetLetter) ?? 0) + 1);
    }
  }

  for (let index = 0; index < 5; index += 1) {
    if (statuses[index] === "correct") {
      continue;
    }

    const letter = guess[index];
    const remaining = leftoverCounts.get(letter) ?? 0;
    if (remaining > 0) {
      statuses[index] = "present";
      leftoverCounts.set(letter, remaining - 1);
    }
  }

  return statuses;
}

function statusClass(status: LetterStatus): string {
  if (status === "correct") {
    return "bg-emerald-500/80 border-emerald-300 text-white";
  }
  if (status === "present") {
    return "bg-amber-500/80 border-amber-300 text-white";
  }
  return "bg-slate-700/70 border-slate-500 text-slate-100";
}

export function WordleGame() {
  const [targetWord, setTargetWord] = useState<string>(randomWord);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState("Guess the 5-letter word.");

  const restartGame = useCallback(() => {
    setTargetWord(randomWord());
    setGuesses([]);
    setCurrentGuess("");
    setGameOver(false);
    setWon(false);
    setMessage("Guess the 5-letter word.");
  }, []);

  const submitGuess = useCallback(() => {
    if (gameOver) {
      return;
    }

    const guess = currentGuess.trim().toLowerCase();
    if (guess.length !== 5) {
      setMessage("Enter exactly 5 letters.");
      return;
    }

    if (!WORD_BANK.includes(guess as (typeof WORD_BANK)[number])) {
      setMessage("Word is not in the current dictionary.");
      return;
    }

    const nextGuesses = [...guesses, guess];
    setGuesses(nextGuesses);
    setCurrentGuess("");

    if (guess === targetWord) {
      setWon(true);
      setGameOver(true);
      setMessage("Perfect. You solved it.");
      return;
    }

    if (nextGuesses.length >= 6) {
      setGameOver(true);
      setMessage(`No attempts left. Word was "${targetWord.toUpperCase()}".`);
      return;
    }

    setMessage(`${6 - nextGuesses.length} attempts remaining.`);
  }, [currentGuess, gameOver, guesses, targetWord]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitGuess();
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        setCurrentGuess((previous) => previous.slice(0, -1));
        return;
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        restartGame();
        return;
      }

      if (/^[a-zA-Z]$/.test(event.key)) {
        setCurrentGuess((previous) => (previous + event.key.toLowerCase()).slice(0, 5));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [restartGame, submitGuess]);

  const boardRows = useMemo(() => {
    return Array.from({ length: 6 }, (_, rowIndex) => {
      if (rowIndex < guesses.length) {
        return guesses[rowIndex].split("");
      }
      if (rowIndex === guesses.length && !gameOver) {
        return currentGuess.padEnd(5, " ").split("");
      }
      return Array(5).fill(" ");
    });
  }, [currentGuess, gameOver, guesses]);

  return (
    <GameFrame
      title="Wordle"
      subtitle="Six attempts to guess the hidden five-letter word."
      status={gameOver ? (won ? "Solved" : "Failed") : "Active"}
      actions={
        <>
          <span className="chip">Attempts {guesses.length}/6</span>
          <button
            type="button"
            onClick={restartGame}
            className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
          >
            New Word
          </button>
        </>
      }
      footer="Controls: Type letters, Enter to submit, Backspace to edit, R to restart."
    >
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
        <div className="grid grid-cols-5 gap-2">
          {boardRows.flatMap((row, rowIndex) =>
            row.map((letter, columnIndex) => {
              const isSubmittedRow = rowIndex < guesses.length;
              const letterStatuses = isSubmittedRow ? evaluateGuess(targetWord, guesses[rowIndex]) : null;
              const status = letterStatuses?.[columnIndex];

              return (
                <div
                  key={`${rowIndex}-${columnIndex}`}
                  className={`flex h-12 w-12 items-center justify-center rounded-md border text-lg font-black uppercase ${
                    status ? statusClass(status) : "border-[var(--border-soft)] bg-[var(--surface-2)] text-[var(--text-primary)]"
                  }`}
                >
                  {letter === " " ? "" : letter}
                </div>
              );
            })
          )}
        </div>

        {!gameOver ? (
          <div className="flex w-full gap-2">
            <input
              value={currentGuess}
              onChange={(event) =>
                setCurrentGuess(event.target.value.toLowerCase().replace(/[^a-z]/g, "").slice(0, 5))
              }
              maxLength={5}
              className="focus-ring flex-1 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm uppercase text-[var(--text-primary)]"
              placeholder="Type guess"
            />
            <button
              type="button"
              onClick={submitGuess}
              className="focus-ring rounded-xl border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
            >
              Guess
            </button>
          </div>
        ) : null}

        <p className="text-center text-sm text-[var(--text-muted)]">{message}</p>
      </div>
    </GameFrame>
  );
}

export default WordleGame;
