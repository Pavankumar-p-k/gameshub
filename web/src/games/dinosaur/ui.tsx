"use client";

import React, { useEffect, useRef, useState } from "react";

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function DinosaurGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isJumping, setIsJumping] = useState(false);

  const dino = { x: 50, y: 150, width: 20, height: 20, dy: 0 };
  const obstacles: Obstacle[] = [];
  const gravity = 0.6;
  const jumpStrength = -12;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw ground
      ctx.fillStyle = "black";
      ctx.fillRect(0, 170, canvas.width, 2);

      // Draw dino
      ctx.fillStyle = "green";
      ctx.fillRect(dino.x, dino.y, dino.width, dino.height);

      // Update dino
      dino.y += dino.dy;
      dino.dy += gravity;
      if (dino.y >= 150) {
        dino.y = 150;
        dino.dy = 0;
        setIsJumping(false);
      }

      // Add obstacles
      if (Math.random() < 0.01) {
        obstacles.push({ x: canvas.width, y: 150, width: 20, height: 20 });
      }

      // Update obstacles
      obstacles.forEach((obs, i) => {
        obs.x -= 5;
        ctx.fillStyle = "red";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Collision
        if (
          dino.x < obs.x + obs.width &&
          dino.x + dino.width > obs.x &&
          dino.y < obs.y + obs.height &&
          dino.y + dino.height > obs.y
        ) {
          setGameOver(true);
        }

        if (obs.x + obs.width < 0) {
          obstacles.splice(i, 1);
          setScore(s => s + 1);
        }
      });

      if (!gameOver) {
        animationId = requestAnimationFrame(gameLoop);
      }
    };

    gameLoop();

    return () => cancelAnimationFrame(animationId);
  }, [gameOver]);

  const handleJump = () => {
    if (!isJumping && !gameOver) {
      dino.dy = jumpStrength;
      setIsJumping(true);
    }
  };

  const resetGame = () => {
    setGameOver(false);
    setScore(0);
    obstacles.length = 0;
    dino.y = 150;
    dino.dy = 0;
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        handleJump();
      } else if (e.key === "r" || e.key === "R") {
        resetGame();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isJumping, gameOver]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Dinosaur Game</h1>
      <p>Score: {score}</p>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="border"
        onClick={handleJump}
      />
      <p>Click to jump!</p>
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

export default DinosaurGame;