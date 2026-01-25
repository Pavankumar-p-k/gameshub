"use client";

import React, { useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
}

export function SlitherGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>([{ x: 200, y: 200 }]);
  const [direction, setDirection] = useState<Point>({ x: 10, y: 0 });
  const [food, setFood] = useState<Point>({ x: 100, y: 100 });
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: any;

    const gameLoop = () => {
      if (gameOver) return;

      const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

      // Check collision with walls
      if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        setGameOver(true);
        return;
      }

      // Check self collision
      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        return;
      }

      const newSnake = [head, ...snake];

      // Check food
      if (head.x === food.x && head.y === food.y) {
        setFood({
          x: Math.floor(Math.random() * (canvas.width / 10)) * 10,
          y: Math.floor(Math.random() * (canvas.height / 10)) * 10,
        });
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "green";
      newSnake.forEach(segment => ctx.fillRect(segment.x, segment.y, 10, 10));
      ctx.fillStyle = "red";
      ctx.fillRect(food.x, food.y, 10, 10);

      animationId = setTimeout(gameLoop, 100);
    };

    gameLoop();

    return () => clearTimeout(animationId);
  }, [snake, direction, food, gameOver]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          if (direction.y === 0) setDirection({ x: 0, y: -10 });
          break;
        case "ArrowDown":
          if (direction.y === 0) setDirection({ x: 0, y: 10 });
          break;
        case "ArrowLeft":
          if (direction.x === 0) setDirection({ x: -10, y: 0 });
          break;
        case "ArrowRight":
          if (direction.x === 0) setDirection({ x: 10, y: 0 });
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [direction]);

  const resetGame = () => {
    setSnake([{ x: 200, y: 200 }]);
    setDirection({ x: 10, y: 0 });
    setFood({ x: 100, y: 100 });
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Slither (Snake)</h1>
      <canvas ref={canvasRef} width={400} height={400} className="border" />
      <p>Use arrow keys to move</p>
      {gameOver && (
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

export default SlitherGame;