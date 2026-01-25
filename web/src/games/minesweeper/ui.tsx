"use client";

import React, { useEffect, useState } from "react";

const SIZE = 9;
const MINES = 10;

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export function MinesweeperGame() {
  const [board, setBoard] = useState<Cell[][]>(
    Array(SIZE).fill(null).map(() =>
      Array(SIZE).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      }))
    )
  );
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const initializeBoard = () => {
    const newBoard = Array(SIZE).fill(null).map(() =>
      Array(SIZE).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      }))
    );

    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < MINES) {
      const x = Math.floor(Math.random() * SIZE);
      const y = Math.floor(Math.random() * SIZE);
      if (!newBoard[y][x].isMine) {
        newBoard[y][x].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbors
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (!newBoard[y][x].isMine) {
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < SIZE && nx >= 0 && nx < SIZE && newBoard[ny][nx].isMine) {
                count++;
              }
            }
          }
          newBoard[y][x].neighborMines = count;
        }
      }
    }

    setBoard(newBoard);
    setGameOver(false);
    setWon(false);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        initializeBoard();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const revealCell = (x: number, y: number) => {
    if (gameOver || board[y][x].isRevealed || board[y][x].isFlagged) return;

    const newBoard = [...board.map(row => [...row])];
    newBoard[y][x].isRevealed = true;

    if (newBoard[y][x].isMine) {
      setGameOver(true);
      // Reveal all mines
      for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
          if (newBoard[i][j].isMine) newBoard[i][j].isRevealed = true;
        }
      }
    } else if (newBoard[y][x].neighborMines === 0) {
      // Reveal neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < SIZE && nx >= 0 && nx < SIZE && !newBoard[ny][nx].isRevealed) {
            revealCell(nx, ny);
          }
        }
      }
    }

    setBoard(newBoard);

    // Check win
    const revealedCells = newBoard.flat().filter(cell => cell.isRevealed).length;
    if (revealedCells === SIZE * SIZE - MINES) {
      setWon(true);
      setGameOver(true);
    }
  };

  const flagCell = (x: number, y: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (gameOver || board[y][x].isRevealed) return;
    const newBoard = [...board.map(row => [...row])];
    newBoard[y][x].isFlagged = !newBoard[y][x].isFlagged;
    setBoard(newBoard);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Minesweeper</h1>
      <div className="grid grid-cols-9 gap-1">
        {board.flat().map((cell, index) => {
          const x = index % SIZE;
          const y = Math.floor(index / SIZE);
          return (
            <button
              key={index}
              onClick={() => revealCell(x, y)}
              onContextMenu={(e) => flagCell(x, y, e)}
              className={`w-8 h-8 border flex items-center justify-center text-sm font-bold ${
                cell.isRevealed
                  ? cell.isMine
                    ? "bg-red-500"
                    : "bg-gray-200"
                  : cell.isFlagged
                  ? "bg-yellow-300"
                  : "bg-gray-400"
              }`}
            >
              {cell.isRevealed ? (cell.isMine ? "💣" : cell.neighborMines || "") : cell.isFlagged ? "🚩" : ""}
            </button>
          );
        })}
      </div>
      <p>Left click to reveal, right click to flag</p>
      {gameOver && (
        <div>
          <p>{won ? "You won!" : "Game Over!"}</p>
          <button onClick={initializeBoard} className="px-3 py-1 bg-blue-500 text-white rounded">
            New Game
          </button>
        </div>
      )}
    </div>
  );
}

export default MinesweeperGame;