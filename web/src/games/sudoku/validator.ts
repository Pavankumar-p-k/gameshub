export function isValidPlacement(
  board: string[],
  index: number,
  value: string
): boolean {
  if (value === "") return true;

  const row = Math.floor(index / 9);
  const col = index % 9;

  // Row check
  for (let c = 0; c < 9; c++) {
    const i = row * 9 + c;
    if (i !== index && board[i] === value) {
      return false;
    }
  }

  // Column check
  for (let r = 0; r < 9; r++) {
    const i = r * 9 + col;
    if (i !== index && board[i] === value) {
      return false;
    }
  }

  // 3x3 box check
  const boxRowStart = Math.floor(row / 3) * 3;
  const boxColStart = Math.floor(col / 3) * 3;

  for (let r = boxRowStart; r < boxRowStart + 3; r++) {
    for (let c = boxColStart; c < boxColStart + 3; c++) {
      const i = r * 9 + c;
      if (i !== index && board[i] === value) {
        return false;
      }
    }
  }

  return true;
}
