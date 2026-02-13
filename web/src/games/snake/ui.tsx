"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/GameFrame";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  GameState,
  Point,
  changeDirection,
  initializeGame,
  updateGame,
} from "./engine";

const CELL_SIZE = 14;

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [gameState, setGameState] = useState<GameState>(initializeGame);

  const resetGame = useCallback(() => {
    setGameState(initializeGame());
  }, []);

  const queueDirection = useCallback((direction: Point) => {
    setGameState((previous) => changeDirection(previous, direction));
  }, []);

  useEffect(() => {
    if (gameState.gameOver) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGameState((previous) => updateGame(previous));
    }, gameState.speed);

    return () => window.clearTimeout(timeoutId);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
        event.preventDefault();
        queueDirection({ x: 0, y: -1 });
      } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
        event.preventDefault();
        queueDirection({ x: 0, y: 1 });
      } else if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        event.preventDefault();
        queueDirection({ x: -1, y: 0 });
      } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        event.preventDefault();
        queueDirection({ x: 1, y: 0 });
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [queueDirection, resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "rgba(13, 148, 136, 0.2)");
    gradient.addColorStop(1, "rgba(8, 47, 73, 0.65)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#22c55e";
    for (const segment of gameState.snake) {
      context.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    }

    context.fillStyle = "#f97316";
    context.fillRect(gameState.food.x * CELL_SIZE, gameState.food.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
  }, [gameState]);

  const onTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStart.current) {
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const threshold = 24;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      queueDirection({ x: dx > 0 ? 1 : -1, y: 0 });
    } else if (Math.abs(dy) > threshold) {
      queueDirection({ x: 0, y: dy > 0 ? 1 : -1 });
    }

    touchStart.current = null;
  };

  return (
    <GameFrame
      title="Snake"
      subtitle="Eat food, grow longer, and avoid crashing."
      status={gameState.gameOver ? "Game Over" : "Alive"}
      actions={
        <>
          <span className="chip">Score {gameState.score}</span>
          <span className="chip">Speed {Math.max(1, Math.round((220 - gameState.speed) / 10))}</span>
          <button
            type="button"
            onClick={resetGame}
            className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
          >
            Restart
          </button>
        </>
      }
      footer="Controls: Arrow keys or WASD. Swipe on touch devices. Press R to restart."
    >
      <canvas
        ref={canvasRef}
        width={BOARD_WIDTH * CELL_SIZE}
        height={BOARD_HEIGHT * CELL_SIZE}
        className="mx-auto w-full max-w-[560px] rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      />
    </GameFrame>
  );
}

export default SnakeGame;
