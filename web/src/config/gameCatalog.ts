export interface GameCatalogItem {
  slug: string;
  name: string;
  description: string;
  tag: string;
  difficulty: "Easy" | "Medium" | "Hard";
  icon: string;
  color: string; // accent color for the card
}

export const GAME_CATALOG: GameCatalogItem[] = [
  {
    slug: "snake",
    name: "Snake",
    description: "Guide a growing snake to eat food without hitting walls or yourself.",
    tag: "Arcade",
    difficulty: "Medium",
    icon: "🐍",
    color: "#22c55e",
  },
  {
    slug: "dinosaur",
    name: "Dino Runner",
    description: "Endless runner — jump over cacti and survive as long as possible.",
    tag: "Arcade",
    difficulty: "Easy",
    icon: "🦕",
    color: "#84cc16",
  },
  {
    slug: "slither",
    name: "Slither",
    description: "Wrapped-arena snake with increasing speed and no wall safety.",
    tag: "Arcade",
    difficulty: "Medium",
    icon: "🌀",
    color: "#06b6d4",
  },
  {
    slug: "tetris",
    name: "Tetris",
    description: "Stack tetrominoes, clear lines, and survive rising speed.",
    tag: "Arcade",
    difficulty: "Hard",
    icon: "🧩",
    color: "#818cf8",
  },
  {
    slug: "pong",
    name: "Pong",
    description: "Classic paddle duel against adaptive AI. First to 7 wins.",
    tag: "Classic",
    difficulty: "Easy",
    icon: "🏓",
    color: "#38bdf8",
  },
  {
    slug: "krunker",
    name: "Krunker Arena",
    description: "Top-down space shooter — blast UFOs before they reach you.",
    tag: "Action",
    difficulty: "Hard",
    icon: "🚀",
    color: "#f43f5e",
  },
  {
    slug: "2048",
    name: "2048",
    description: "Merge tiles strategically to hit 2048 and beyond.",
    tag: "Puzzle",
    difficulty: "Medium",
    icon: "🔢",
    color: "#f59e0b",
  },
  {
    slug: "minesweeper",
    name: "Minesweeper",
    description: "Reveal safe cells, flag mines, and clear the field.",
    tag: "Puzzle",
    difficulty: "Hard",
    icon: "💣",
    color: "#ef4444",
  },
  {
    slug: "wordle",
    name: "Wordle",
    description: "Guess the 5-letter word in 6 tries with color-coded clues.",
    tag: "Word",
    difficulty: "Medium",
    icon: "📝",
    color: "#a3e635",
  },
  {
    slug: "sudoku",
    name: "Sudoku",
    description: "Fill the 9×9 grid — every row, column, and box unique.",
    tag: "Puzzle",
    difficulty: "Medium",
    icon: "🔲",
    color: "#8b5cf6",
  },
  {
    slug: "tictactoe",
    name: "Tic Tac Toe",
    description: "Classic X vs O strategy — play against a friend or AI.",
    tag: "Classic",
    difficulty: "Easy",
    icon: "⭕",
    color: "#ec4899",
  },
];

export function gameHref(slug: string): string {
  return `/games/${slug}`;
}
