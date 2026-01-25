"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { initializeBoard, move, addRandomTile, isGameOver, Board } from "./engine";

export function Game2048() {
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((direction: string) => {
    const result = move(board, direction);
    if (result.moved) {
      const newBoard = result.board;
      addRandomTile(newBoard);
      setBoard(newBoard);
      setScore(s => s + result.score);
      if (isGameOver(newBoard)) {
        setGameOver(true);
      }
    }
  }, [board]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      let direction = "";
      switch (e.key) {
        case "ArrowLeft":
          direction = "left";
          break;
        case "ArrowRight":
          direction = "right";
          break;
        case "ArrowUp":
          direction = "up";
          break;
        case "ArrowDown":
          direction = "down";
          break;
        case "r":
        case "R":
          resetGame();
          return;
      }
      if (direction) {
        e.preventDefault();
        handleMove(direction);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [board, gameOver, handleMove]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) handleMove("right");
        else handleMove("left");
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) handleMove("down");
        else handleMove("up");
      }
    }
    setTouchStart(null);
  };

  const resetGame = () => {
    setBoard(initializeBoard());
    setScore(0);
    setGameOver(false);
  };

  const getTileColor = (value: number) => {
    const colors: { [key: number]: string } = {
      2: "bg-gray-200",
      4: "bg-gray-300",
      8: "bg-orange-200",
      16: "bg-orange-300",
      32: "bg-red-200",
      64: "bg-red-300",
      128: "bg-yellow-200",
      256: "bg-yellow-300",
      512: "bg-green-200",
      1024: "bg-blue-200",
      2048: "bg-purple-200",
    };
    return colors[value] || "bg-gray-400";
  };

  return (
    <div
      ref={gameRef}
      className="flex flex-col items-center gap-4 p-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <h1 className="text-2xl font-bold">2048</h1>
      <p>Score: {score}</p>
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((value, index) => (
          <div
            key={index}
            className={`w-16 h-16 flex items-center justify-center text-lg font-bold border ${getTileColor(value)}`}
          >
            {value || ""}
          </div>
        ))}
      </div>
      <p>Use arrow keys or swipe to move. Press R to restart</p>
      {gameOver && (
        <div>
          <p>Game Over!</p>
          <button onClick={resetGame} className="px-3 py-1 bg-blue-500 text-white rounded">
            New Game
          </button>
        </div>
      )}
    </div>
  );
}

export default Game2048;