/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useCallback, useEffect, useState } from "react";

export function TicTacToeGame() {
  const [board, setBoard] = useState<string[]>(Array(9).fill(""));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<string | null>(null);

  const checkWinner = (newBoard: string[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const line of lines) {
      const [a, b, c] = line;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        return newBoard[a];
      }
    }
    return null;
  };

  const handleClick = useCallback((index: number) => {
    if (board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    const win = checkWinner(newBoard);
    if (win) {
      setWinner(win);
    } else if (newBoard.every(cell => cell)) {
      setWinner("Draw");
    } else {
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }
  }, [board, currentPlayer, winner, checkWinner]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= "1" && key <= "9") {
        const index = parseInt(key) - 1;
        handleClick(index);
      } else if (key === "r" || key === "R") {
        // eslint-disable-next-line react-hooks/immutability
        resetGame();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [board, currentPlayer, handleClick, winner]);

  const resetGame = () => {
    setBoard(Array(9).fill(""));
    setCurrentPlayer("X");
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Tic Tac Toe</h1>
      <p>Current player: {currentPlayer}</p>
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className="w-16 h-16 border flex items-center justify-center text-2xl font-bold"
          >
            {cell || (index + 1).toString()}
          </button>
        ))}
      </div>
      <p>Click or press 1-9 to play. Press R to reset</p>
      {winner && (
        <div>
          <p>{winner === "Draw" ? "It's a draw!" : `Winner: ${winner}`}</p>
          <button onClick={resetGame} className="px-3 py-1 bg-blue-500 text-white rounded">
            New Game
          </button>
        </div>
      )}
    </div>
  );
}

export default TicTacToeGame;