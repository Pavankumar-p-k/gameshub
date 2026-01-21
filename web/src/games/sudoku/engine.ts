export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface SudokuBoard {
  puzzle: number[][];
  solution: number[][];
  difficulty: Difficulty;
}

const GRID_SIZE = 9;
const BOX_SIZE = 3;

/**
 * Generate a random number from min to max (inclusive)
 */
function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle array in place
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Check if a number is valid at a given position
 */
function isValid(board: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let c = 0; c < GRID_SIZE; c++) {
    if (board[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < GRID_SIZE; r++) {
    if (board[r][col] === num) return false;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true;
}

/**
 * Generate a complete valid sudoku solution using backtracking
 */
function generateSolution(): number[][] {
  const board: number[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));

  function solve(): boolean {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (board[row][col] === 0) {
          const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

          for (const num of numbers) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;

              if (solve()) {
                return true;
              }

              board[row][col] = 0;
            }
          }

          return false;
        }
      }
    }

    return true;
  }

  solve();
  return board;
}

/**
 * Create a puzzle by removing numbers from the solution
 */
function createPuzzle(solution: number[][], cellsToRemove: number): number[][] {
  const puzzle = solution.map((row) => [...row]);
  let removed = 0;

  while (removed < cellsToRemove) {
    const row = randomNumber(0, GRID_SIZE - 1);
    const col = randomNumber(0, GRID_SIZE - 1);

    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removed++;
    }
  }

  return puzzle;
}

/**
 * Get the number of cells to remove based on difficulty
 */
function getCellsToRemove(difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy":
      return 30; // ~50 clues
    case "medium":
      return 40; // ~40 clues
    case "hard":
      return 50; // ~30 clues
    case "expert":
      return 55; // ~25 clues
    default:
      return 40;
  }
}

/**
 * Generate a complete sudoku puzzle with solution
 */
export function generateSudoku(difficulty: Difficulty): SudokuBoard {
  const solution = generateSolution();
  const cellsToRemove = getCellsToRemove(difficulty);
  const puzzle = createPuzzle(solution, cellsToRemove);

  return {
    puzzle,
    solution,
    difficulty,
  };
}

/**
 * Flatten a 2D board to 1D array
 */
export function flattenBoard(board: number[][]): number[] {
  return board.flat();
}

/**
 * Convert 1D index to row and column
 */
export function indexToRowCol(index: number): [number, number] {
  return [Math.floor(index / GRID_SIZE), index % GRID_SIZE];
}

/**
 * Convert row and column to 1D index
 */
export function rowColToIndex(row: number, col: number): number {
  return row * GRID_SIZE + col;
}

/**
 * Check if the board is complete and valid
 */
export function isBoardComplete(board: number[]): boolean {
  return board.every((cell) => cell !== 0);
}

/**
 * Check if the current board matches the solution
 */
export function isBoardCorrect(board: number[], solution: number[]): boolean {
  return board.every((cell, index) => cell === solution[index]);
}
