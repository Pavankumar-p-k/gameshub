"use client";

import React, { useEffect, useRef, useState } from "react";

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function KrunkerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [player, setPlayer] = useState<Entity>({ x: 200, y: 350, width: 20, height: 20 });
  const [bullets, setBullets] = useState<Entity[]>([]);
  const [enemies, setEnemies] = useState<Entity[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const gameLoop = () => {
      if (gameOver) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw player
      ctx.fillStyle = "blue";
      ctx.fillRect(player.x, player.y, player.width, player.height);

      // Update bullets
      setBullets(bullets =>
        bullets
          .map(b => ({ ...b, y: b.y - 5 }))
          .filter(b => b.y > 0)
      );

      // Draw bullets
      ctx.fillStyle = "yellow";
      bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

      // Add enemies
      if (Math.random() < 0.02) {
        setEnemies(enemies => [
          ...enemies,
          { x: Math.random() * (canvas.width - 20), y: 0, width: 20, height: 20 },
        ]);
      }

      // Update enemies
      setEnemies(enemies =>
        enemies
          .map(e => ({ ...e, y: e.y + 2 }))
          .filter(e => e.y < canvas.height)
      );

      // Draw enemies
      ctx.fillStyle = "red";
      enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));

      // Check collisions
      bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
          if (
            b.x < e.x + e.width &&
            b.x + b.width > e.x &&
            b.y < e.y + e.height &&
            b.y + b.height > e.y
          ) {
            setBullets(bullets => bullets.filter((_, i) => i !== bi));
            setEnemies(enemies => enemies.filter((_, i) => i !== ei));
            setScore(s => s + 1);
          }
        });
      });

      // Check player collision
      enemies.forEach(e => {
        if (
          player.x < e.x + e.width &&
          player.x + player.width > e.x &&
          player.y < e.y + e.height &&
          player.y + player.height > e.y
        ) {
          setGameOver(true);
        }
      });

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => cancelAnimationFrame(animationId);
  }, [player, bullets, enemies, gameOver]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          setPlayer(p => ({ ...p, x: Math.max(0, p.x - 5) }));
          break;
        case "ArrowRight":
          setPlayer(p => ({ ...p, x: Math.min(380, p.x + 5) }));
          break;
        case " ":
          e.preventDefault();
          setBullets(b => [...b, { x: player.x + 10, y: player.y, width: 2, height: 10 }]);
          break;
        case "r":
        case "R":
          resetGame();
          return;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [player]);

  const resetGame = () => {
    setPlayer({ x: 200, y: 350, width: 20, height: 20 });
    setBullets([]);
    setEnemies([]);
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Krunker (Shooter)</h1>
      <p>Score: {score}</p>
      <canvas ref={canvasRef} width={400} height={400} className="border" />
      <p>Use arrow keys to move, space to shoot</p>
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

export default KrunkerGame;