"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  initializeGame,
  updateGame,
  changeDirection,
  GameState,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  Point,
} from "./engine";

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initializeGame());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  /* ==========================
     Game loop
  ========================= */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let timeoutId: any;

    const loop = () => {
      setGameState(prev => {
        const newState = updateGame(prev);

        // Draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw snake
        ctx.fillStyle = "green";
        newState.snake.forEach(seg =>
          ctx.fillRect(seg.x * 10, seg.y * 10, 10, 10)
        );

        // Draw food
        ctx.fillStyle = "red";
        ctx.fillRect(
          newState.food.x * 10,
          newState.food.y * 10,
          10,
          10
        );

        return newState;
      });

      if (!gameState.gameOver) {
        timeoutId = setTimeout(loop, gameState.speed);
      }
    };

    loop();

    return () => clearTimeout(timeoutId);
  }, [gameState.gameOver, gameState.speed]);

  /* ==========================
     Keyboard controls
  ========================= */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameState.gameOver) return;

      let dir: Point | null = null;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          dir = { x: 0, y: -1 };
          break;
        case "ArrowDown":
        case "s":
        case "S":
          dir = { x: 0, y: 1 };
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          dir = { x: -1, y: 0 };
          break;
        case "ArrowRight":
        case "d":
        case "D":
          dir = { x: 1, y: 0 };
          break;
        case "r":
        case "R":
          resetGame();
          return;
      }

      if (dir) {
        e.preventDefault();
        setGameState(prev => changeDirection(prev, dir!));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState.gameOver]);

  /* ==========================
     Touch / swipe controls
  ========================= */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) < 20) return; // minimum swipe distance

      let dir: Point = { x: 0, y: 0 };
      if (absX > absY) {
        dir.x = dx > 0 ? 1 : -1;
      } else {
        dir.y = dy > 0 ? 1 : -1;
      }

      setGameState(prev => changeDirection(prev, dir));
      touchStartRef.current = null;
    };

    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const resetGame = () => setGameState(initializeGame());

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Snake</h1>
      <p>Score: {gameState.score}</p>
      <canvas
        ref={canvasRef}
        width={BOARD_WIDTH * 10}
        height={BOARD_HEIGHT * 10}
        className="border touch-none"
      />
      {gameState.gameOver && (
        <div>
          <p>Game Over!</p>
          <button
            onClick={resetGame}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            Restart
          </button>
        </div>
      )}
      <p className="text-sm text-gray-500">
        Use arrow keys / WASD on desktop or swipe on mobile
      </p>
    </div>
  );
}

export default SnakeGame;
