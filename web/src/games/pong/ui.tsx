"use client";

import React, { useEffect, useRef, useState } from "react";
import { initializeGame, updateGame, movePlayer, GameState, CANVAS_WIDTH, CANVAS_HEIGHT } from "./engine";

export function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initializeGame());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const gameLoop = () => {
      setGameState(prevState => {
        const newState = updateGame(prevState);

        // Draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.fillRect(10, newState.playerY, 10, 50);
        ctx.fillRect(380, newState.aiY, 10, 50);
        ctx.beginPath();
        ctx.arc(newState.ball.x, newState.ball.y, 5, 0, Math.PI * 2);
        ctx.fill();

        return newState;
      });

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => cancelAnimationFrame(animationId);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          setGameState(prevState => movePlayer(prevState, -1));
          break;
        case "ArrowDown":
        case "s":
        case "S":
          setGameState(prevState => movePlayer(prevState, 1));
          break;
        case "r":
        case "R":
          setGameState(initializeGame());
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleMove = (direction: number) => {
    setGameState(prevState => movePlayer(prevState, direction));
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Pong</h1>
      <p>Player: {gameState.playerScore} - AI: {gameState.aiScore}</p>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border bg-black" />
      <p>Use up/down arrows or WASD to move. Press R to reset</p>
      <div className="flex flex-col gap-2">
        <button onClick={() => handleMove(-1)} className="px-3 py-1 bg-blue-500 text-white rounded">Up</button>
        <button onClick={() => handleMove(1)} className="px-3 py-1 bg-blue-500 text-white rounded">Down</button>
      </div>
    </div>
  );
}

export default PongGame;