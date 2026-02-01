export const SIZE = 4;

export type Board = number[][];

export function initializeBoard(): Board {
  const board = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
  addRandomTile(board);
  addRandomTile(board);
  return board;
}

export function addRandomTile(board: Board): void {
  const emptyCells = [];
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (board[i][j] === 0) emptyCells.push({ i, j });
    }
  }
  if (emptyCells.length > 0) {
    const { i, j } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[i][j] = Math.random() < 0.9 ? 2 : 4;
  }
}

export function moveLeft(board: Board): { board: Board; moved: boolean; score: number } {
  let moved = false;
  let score = 0;
  const newBoard = board.map(row => [...row]);
  for (let i = 0; i < SIZE; i++) {
    let row = newBoard[i].filter(val => val !== 0);
    for (let j = 0; j < row.length - 1; j++) {
      if (row[j] === row[j + 1]) {
        row[j] *= 2;
        score += row[j];
        row[j + 1] = 0;
      }
    }
    row = row.filter(val => val !== 0);
    while (row.length < SIZE) row.push(0);
    if (JSON.stringify(newBoard[i]) !== JSON.stringify(row)) moved = true;
    newBoard[i] = row;
  }
  return { board: newBoard, moved, score };
}

export function rotateBoard(board: Board): Board {
  const newBoard = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      newBoard[j][SIZE - 1 - i] = board[i][j];
    }
  }
  return newBoard;
}

export function move(board: Board, direction: string): { board: Board; moved: boolean; score: number } {
  let newBoard = board.map(row => [...row]);
  let moved = false;
  let score = 0;
  if (direction === "left") {
    const result = moveLeft(newBoard);
    newBoard = result.board;
    moved = result.moved;
    score = result.score;
  } else if (direction === "right") {
    newBoard = rotateBoard(rotateBoard(newBoard));
    const result = moveLeft(newBoard);
    newBoard = result.board;
    moved = result.moved;
    score = result.score;
    newBoard = rotateBoard(rotateBoard(newBoard));
  } else if (direction === "up") {
    newBoard = rotateBoard(rotateBoard(rotateBoard(newBoard)));
    const result = moveLeft(newBoard);
    newBoard = result.board;
    moved = result.moved;
    score = result.score;
    newBoard = rotateBoard(newBoard);
  } else if (direction === "down") {
    newBoard = rotateBoard(newBoard);
    const result = moveLeft(newBoard);
    newBoard = result.board;
    moved = result.moved;
    score = result.score;
    newBoard = rotateBoard(rotateBoard(rotateBoard(newBoard)));
  }
  return { board: newBoard, moved, score };
}

export function isGameOver(board: Board): boolean {
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (board[i][j] === 0) return false;
      if (i < SIZE - 1 && board[i][j] === board[i + 1][j]) return false;
      if (j < SIZE - 1 && board[i][j] === board[i][j + 1]) return false;
    }
  }
  return true;
}