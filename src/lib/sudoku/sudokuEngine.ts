export type Board = number[][]; // 9x9 with 0 for empty

function cloneBoard(b: Board): Board {
  return b.map(row => row.slice());
}

export function isValidMove(board: Board, row: number, col: number, val: number) {
  if (val < 1 || val > 9) return false;
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === val) return false;
    if (board[i][col] === val) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (board[r][c] === val) return false;
    }
  }
  return true;
}

// Backtracking solver (modifies board)
export function solve(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        for (let n = 1; n <= 9; n++) {
          if (isValidMove(board, r, c, n)) {
            board[r][c] = n;
            if (solve(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Count number of solutions up to limit (stop early)
export function countSolutions(board: Board, limit = 2): number {
  let count = 0;
  const b = cloneBoard(board);

  function backtrack(): boolean {
    if (count >= limit) return true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValidMove(b, r, c, n)) {
              b[r][c] = n;
              backtrack();
              b[r][c] = 0;
              if (count >= limit) return true;
            }
          }
          return false;
        }
      }
    }
    // found a solution
    count++;
    return false;
  }

  backtrack();
  return count;
}

// generate a full valid board with randomized choices
function generateFullSolution(): Board {
  const b: Board = Array.from({ length: 9 }, () => Array(9).fill(0));

  function shuffle(arr: number[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function fill() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          const nums = [1,2,3,4,5,6,7,8,9];
          shuffle(nums);
          for (const n of nums) {
            if (isValidMove(b, r, c, n)) {
              b[r][c] = n;
              if (fill()) return true;
              b[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  fill();
  return b;
}

export type Difficulty = "easy" | "medium" | "hard";

export function generate(difficulty: Difficulty = "medium"): { puzzle: Board; solution: Board } {
  const solution = generateFullSolution();
  const puzzle = cloneBoard(solution);

  // number of cells to remove: more removals -> harder
  let removals = 50;
  if (difficulty === "easy") removals = 40;
  if (difficulty === "medium") removals = 50;
  if (difficulty === "hard") removals = 55;

  const cells = Array.from({length: 81}, (_, i) => i);
  // shuffle cells
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  let removed = 0;
  for (const idx of cells) {
    if (removed >= removals) break;
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    const cpy = cloneBoard(puzzle);
    const solutions = countSolutions(cpy, 2);
    if (solutions !== 1) {
      // keep the cell (revert) if uniqueness lost
      puzzle[r][c] = backup;
    } else {
      removed++;
    }
  }

  return { puzzle, solution };
}
