"use client";

import React, { useEffect, useRef, useState } from "react";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const TETROMINOS = [
  {
    shape: [
      [1, 1, 1, 1],
    ],
    color: "cyan",
  },
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "yellow",
  },
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "purple",
  },
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "blue",
  },
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "orange",
  },
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "green",
  },
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "red",
  },
];

export function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<string[][]>(
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(""))
  );
  const [currentPiece, setCurrentPiece] = useState<any>(null);
  const [position, setPosition] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!currentPiece) {
      const randomTetromino = TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];
      setCurrentPiece(randomTetromino);
      setPosition({ x: 3, y: 0 });
    }
  }, [currentPiece]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw board
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          if (board[y][x]) {
            ctx.fillStyle = board[y][x];
            ctx.fillRect(x * 20, y * 20, 20, 20);
            ctx.strokeStyle = "black";
            ctx.strokeRect(x * 20, y * 20, 20, 20);
          }
        }
      }

      // Draw current piece
      if (currentPiece) {
        ctx.fillStyle = currentPiece.color;
        currentPiece.shape.forEach((row: number[], dy: number) => {
          row.forEach((cell: number, dx: number) => {
            if (cell) {
              ctx.fillRect((position.x + dx) * 20, (position.y + dy) * 20, 20, 20);
              ctx.strokeRect((position.x + dx) * 20, (position.y + dy) * 20, 20, 20);
            }
          });
        });
      }
    };

    draw();
  }, [board, currentPiece, position]);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setPosition(pos => {
        const newPos = { ...pos, y: pos.y + 1 };
        if (checkCollision(newPos)) {
          placePiece();
          return pos;
        }
        return newPos;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [currentPiece, position, gameOver]);

  const checkCollision = (newPos: { x: number; y: number }) => {
    if (!currentPiece) return false;
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const newX = newPos.x + x;
          const newY = newPos.y + y;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || (newY >= 0 && board[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const placePiece = () => {
    if (!currentPiece) return;
    const newBoard = [...board];
    currentPiece.shape.forEach((row: number[], dy: number) => {
      row.forEach((cell: number, dx: number) => {
        if (cell) {
          const x = position.x + dx;
          const y = position.y + dy;
          if (y >= 0) newBoard[y][x] = currentPiece.color;
        }
      });
    });
    setBoard(newBoard);
    clearLines(newBoard);
    setCurrentPiece(null);
  };

  const clearLines = (newBoard: string[][]) => {
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(""));
        setScore(s => s + 100);
        y++;
      }
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          setPosition(pos => {
            const newPos = { ...pos, x: pos.x - 1 };
            return checkCollision(newPos) ? pos : newPos;
          });
          break;
        case "ArrowRight":
          setPosition(pos => {
            const newPos = { ...pos, x: pos.x + 1 };
            return checkCollision(newPos) ? pos : newPos;
          });
          break;
        case "ArrowDown":
          setPosition(pos => {
            const newPos = { ...pos, y: pos.y + 1 };
            if (checkCollision(newPos)) {
              placePiece();
              return pos;
            }
            return newPos;
          });
          break;
        case "ArrowUp":
          // Rotate
          if (currentPiece) {
            const rotated = currentPiece.shape[0].map((_: number, index: number) =>
              currentPiece.shape.map((row: number[]) => row[index]).reverse()
            );
            const rotatedPiece = { ...currentPiece, shape: rotated };
            setCurrentPiece(rotatedPiece);
          }
          break;
        case "r":
        case "R":
          resetGame();
          return;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentPiece, position]);

  const resetGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill("")));
    setCurrentPiece(null);
    setPosition({ x: 3, y: 0 });
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Tetris</h1>
      <p>Score: {score}</p>
      <canvas ref={canvasRef} width={200} height={400} className="border" />
      <p>Use arrow keys to move and rotate</p>
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

export default TetrisGame;