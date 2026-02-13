"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/GameFrame";
import {
  BALL_RADIUS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GameState,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  initializeGame,
  movePlayer,
  updateGame,
} from "./engine";

export function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initializeGame);

  const resetGame = useCallback(() => {
    setGameState(initializeGame());
  }, []);

  useEffect(() => {
    if (gameState.winner) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setGameState((previous) => updateGame(previous));
    }, 16);

    return () => window.clearInterval(intervalId);
  }, [gameState.winner]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
        event.preventDefault();
        setGameState((previous) => movePlayer(previous, -1));
      } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
        event.preventDefault();
        setGameState((previous) => movePlayer(previous, 1));
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const gradient = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, "rgba(16, 184, 249, 0.15)");
    gradient.addColorStop(1, "rgba(5, 15, 45, 0.6)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.strokeStyle = "rgba(255, 255, 255, 0.18)";
    context.setLineDash([8, 8]);
    context.beginPath();
    context.moveTo(CANVAS_WIDTH / 2, 0);
    context.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "#56ccf2";
    context.fillRect(24, gameState.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);

    context.fillStyle = "#ff8a44";
    context.fillRect(CANVAS_WIDTH - 24 - PADDLE_WIDTH, gameState.aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

    context.beginPath();
    context.fillStyle = "#f8fafc";
    context.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    context.fill();
  }, [gameState]);

  return (
    <GameFrame
      title="Pong"
      subtitle="First to 7 points wins."
      status={gameState.winner ? `${gameState.winner} Wins` : "In Match"}
      actions={
        <>
          <span className="chip">Player {gameState.playerScore}</span>
          <span className="chip">AI {gameState.aiScore}</span>
          <button
            type="button"
            onClick={resetGame}
            className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
          >
            Reset
          </button>
        </>
      }
      footer="Controls: W/S or Arrow Up/Down. Press R to restart."
    >
      <div className="space-y-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)]"
        />
        <div className="flex justify-center gap-3 sm:hidden">
          <button
            type="button"
            onClick={() => setGameState((previous) => movePlayer(previous, -1))}
            className="focus-ring rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)]"
          >
            Up
          </button>
          <button
            type="button"
            onClick={() => setGameState((previous) => movePlayer(previous, 1))}
            className="focus-ring rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)]"
          >
            Down
          </button>
        </div>
      </div>
    </GameFrame>
  );
}

export default PongGame;
