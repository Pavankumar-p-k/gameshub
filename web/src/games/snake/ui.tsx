"use client";

import React, { useEffect, useRef, useState } from "react";
import { initializeGame, updateGame, changeDirection, GameState, BOARD_WIDTH, BOARD_HEIGHT } from "./engine";

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initializeGame());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: any;

    const gameLoop = () => {
      setGameState(prevState => {
        const newState = updateGame(prevState);
        if (newState.gameOver) return newState;

        // Draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "green";
        newState.snake.forEach(segment => ctx.fillRect(segment.x * 10, segment.y * 10, 10, 10));
        ctx.fillStyle = "red";
        ctx.fillRect(newState.food.x * 10, newState.food.y * 10, 10, 10);

        return newState;
      });

      if (!gameState.gameOver) {
        animationId = setTimeout(gameLoop, 100);
      }
    };

    gameLoop();

    return () => clearTimeout(animationId);
  }, [gameState.gameOver]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameState.gameOver) return;
      let newDir = { x: 0, y: 0 };
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          newDir = { x: 0, y: -1 };
          break;
        case "ArrowDown":
        case "s":
        case "S":
          newDir = { x: 0, y: 1 };
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          newDir = { x: -1, y: 0 };
          break;
        case "ArrowRight":
        case "d":
        case "D":
          newDir = { x: 1, y: 0 };
          break;
        case "r":
        case "R":
          resetGame();
          return;
      }
      if (newDir.x !== 0 || newDir.y !== 0) {
        e.preventDefault();
        setGameState(prevState => changeDirection(prevState, newDir));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState.gameOver]);

  const resetGame = () => {
    setGameState(initializeGame());
  };

  const handleDirectionChange = (dir: { x: number; y: number }) => {
    setGameState(prevState => changeDirection(prevState, dir));
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Snake</h1>
      <p>Score: {gameState.score}</p>
      <canvas ref={canvasRef} width={BOARD_WIDTH * 10} height={BOARD_HEIGHT * 10} className="border" />
      <p>Use arrow keys or WASD to move. Press R to restart</p>
      <div className="flex gap-2">
        <button onClick={() => handleDirectionChange({ x: 0, y: -1 })} className="px-3 py-1 bg-blue-500 text-white rounded">Up</button>
        <div className="flex flex-col gap-2">
          <button onClick={() => handleDirectionChange({ x: -1, y: 0 })} className="px-3 py-1 bg-blue-500 text-white rounded">Left</button>
          <button onClick={() => handleDirectionChange({ x: 1, y: 0 })} className="px-3 py-1 bg-blue-500 text-white rounded">Right</button>
        </div>
        <button onClick={() => handleDirectionChange({ x: 0, y: 1 })} className="px-3 py-1 bg-blue-500 text-white rounded">Down</button>
      </div>
      {gameState.gameOver && (
        <div>
          <p>Game Over!</p>
          <button onClick={resetGame} className="px-3 py-1 bg-blue-500 text-white rounded">
            Restart
          </button>
        </div>
      )}
    </div>
  );
}

export default SnakeGame;