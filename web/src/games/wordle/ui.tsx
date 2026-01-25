"use client";

import React, { useState, useEffect } from "react";

const WORDS = ["apple", "grape", "lemon", "peach", "berry"];

export function WordleGame() {
  const [targetWord, setTargetWord] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargetWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        newFunction();
      } else if (e.key === "Backspace") {
        setCurrentGuess(currentGuess.slice(0, -1));
      } else if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
        setCurrentGuess(prev => (prev + e.key.toLowerCase()).slice(0, 5));
      } else if (e.key === "r" || e.key === "R") {
        setGuesses([]);
        setCurrentGuess("");
        setGameOver(false);
        setWon(false);
        setTargetWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
      }

        function newFunction() {
            handleSubmit();
        }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentGuess, guesses, gameOver]);

  const getLetterStatus = (letter: string, index: number, guess: string) => {
    if (targetWord[index] === letter) return "correct";
    if (targetWord.includes(letter)) return "present";
    return "absent";
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Wordle</h1>
      <div className="grid grid-cols-5 gap-1">
        {guesses.map((guess, i) =>
          guess.split("").map((letter, j) => (
            <div
              key={`${i}-${j}`}
              className={`w-12 h-12 border flex items-center justify-center font-bold ${
                getLetterStatus(letter, j, guess) === "correct"
                  ? "bg-green-500"
                  : getLetterStatus(letter, j, guess) === "present"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
              }`}
            >
              {letter}
            </div>
          ))
        )}
        {Array.from({ length: 5 - currentGuess.length }, (_, i) => (
          <div key={`empty-${i}`} className="w-12 h-12 border"></div>
        ))}
        {currentGuess.split("").map((letter, i) => (
          <div key={`current-${i}`} className="w-12 h-12 border flex items-center justify-center">
            {letter}
          </div>
        ))}
      </div>
      {!gameOver && (
        <div>
          <input
            type="text"
            value={currentGuess}
            onChange={(e) => setCurrentGuess(e.target.value.toLowerCase().slice(0, 5))}
            maxLength={5}
            className="border p-2"
          />
          <button onClick={handleSubmit} className="ml-2 px-3 py-1 bg-blue-500 text-white rounded">
            Guess
          </button>
        </div>
      )}
      {gameOver && (
        <div>
          {won ? <p>You won!</p> : <p>Game over! Word was {targetWord}</p>}
          <button
            onClick={() => {
              setGuesses([]);
              setCurrentGuess("");
              setGameOver(false);
              setWon(false);
              setTargetWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            New Game
          </button>
        </div>
      )}
    </div>
  );
}

export default WordleGame;

function handleSubmit() {
    throw new Error("Function not implemented.");
}
