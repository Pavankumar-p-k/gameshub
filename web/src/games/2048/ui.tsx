"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/GameFrame";
import { Board, addRandomTile, initializeBoard, isGameOver, move } from "./engine";

interface Game2048State {
  board: Board;
  score: number;
  best: number;
  gameOver: boolean;
}

const TILE_COLORS: Record<number, string> = {
  0: "rgba(255,255,255,0.08)",
  2: "#f8f0db",
  4: "#f2e2bf",
  8: "#f5b56b",
  16: "#f28f52",
  32: "#f66954",
  64: "#f14d62",
  128: "#f2dc63",
  256: "#f6ca4f",
  512: "#f7bd36",
  1024: "#9dd6ff",
  2048: "#75f0c4",
};

function createInitialState(previousBest = 0): Game2048State {
  return {
    board: initializeBoard(),
    score: 0,
    best: previousBest,
    gameOver: false,
  };
}

function tileStyle(value: number): CSSProperties {
  const tone = TILE_COLORS[value] ?? "#dbeafe";
  const textColor = value <= 4 ? "#1f2937" : "#ffffff";
  return { backgroundColor: tone, color: textColor };
}

export function Game2048() {
  const [state, setState] = useState<Game2048State>(() => createInitialState());
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const resetGame = useCallback(() => {
    setState((previous) => createInitialState(Math.max(previous.best, previous.score)));
  }, []);

  const handleMove = useCallback((direction: "left" | "right" | "up" | "down") => {
    setState((previous) => {
      if (previous.gameOver) {
        return previous;
      }

      const result = move(previous.board, direction);
      if (!result.moved) {
        return previous;
      }

      const nextBoard = result.board.map((row) => [...row]);
      addRandomTile(nextBoard);

      const score = previous.score + result.score;
      const best = Math.max(previous.best, score);

      return {
        board: nextBoard,
        score,
        best,
        gameOver: isGameOver(nextBoard),
      };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        resetGame();
        return;
      }

      const directionMap: Record<string, "left" | "right" | "up" | "down" | undefined> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };

      const direction = directionMap[event.key];
      if (!direction) {
        return;
      }

      event.preventDefault();
      handleMove(direction);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove, resetGame]);

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    swipeStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!swipeStart.current) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.current.x;
    const deltaY = touch.clientY - swipeStart.current.y;
    const threshold = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      handleMove(deltaX > 0 ? "right" : "left");
    } else if (Math.abs(deltaY) > threshold) {
      handleMove(deltaY > 0 ? "down" : "up");
    }

    swipeStart.current = null;
  };

  return (
    <GameFrame
      title="2048"
      subtitle="Merge equal tiles. Reach 2048 and keep climbing."
      status={state.gameOver ? "Game Over" : "Running"}
      actions={
        <>
          <span className="chip">Score {state.score}</span>
          <span className="chip">Best {Math.max(state.best, state.score)}</span>
          <button
            type="button"
            onClick={resetGame}
            className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
          >
            New Game
          </button>
        </>
      }
      score={state.score}
      gameOver={state.gameOver}
      footer="Controls: Arrow keys or swipe. Press R to restart."
    >
      <div
        className="mx-auto w-full max-w-sm rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)] p-3"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="grid grid-cols-4 gap-2">
          {state.board.flat().map((value, index) => (
            <div
              key={index}
              style={tileStyle(value)}
              className="flex aspect-square items-center justify-center rounded-xl text-xl font-black"
            >
              {value === 0 ? "" : value}
            </div>
          ))}
        </div>
      </div>
    </GameFrame>
  );
}

export default Game2048;
