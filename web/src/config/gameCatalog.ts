export interface GameCatalogItem {
  slug: string;
  name: string;
  description: string;
  tag: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export const GAME_CATALOG: GameCatalogItem[] = [
  {
    slug: "sudoku",
    name: "Sudoku",
    description: "Number puzzle with hints, difficulty tiers, and keyboard input.",
    tag: "Puzzle",
    difficulty: "Medium",
  },
  {
    slug: "dinosaur",
    name: "Dino Runner",
    description: "Endless runner with jump timing and obstacle avoidance.",
    tag: "Arcade",
    difficulty: "Easy",
  },
  {
    slug: "wordle",
    name: "Wordle",
    description: "Five-letter word challenge with color-coded feedback.",
    tag: "Word",
    difficulty: "Medium",
  },
  {
    slug: "slither",
    name: "Slither",
    description: "Fast snake-style survival with increasing pressure.",
    tag: "Arcade",
    difficulty: "Medium",
  },
  {
    slug: "krunker",
    name: "Krunker Arena",
    description: "Top-down shooter with incoming waves and score tracking.",
    tag: "Action",
    difficulty: "Hard",
  },
  {
    slug: "tictactoe",
    name: "Tic Tac Toe",
    description: "Classic strategy game with instant rematches.",
    tag: "Classic",
    difficulty: "Easy",
  },
  {
    slug: "snake",
    name: "Snake",
    description: "Grid-based snake engine with speed scaling and swipe support.",
    tag: "Arcade",
    difficulty: "Medium",
  },
  {
    slug: "tetris",
    name: "Tetris",
    description: "Tetromino stacking with line clears and progressive challenge.",
    tag: "Arcade",
    difficulty: "Hard",
  },
  {
    slug: "2048",
    name: "2048",
    description: "Merge tiles strategically to hit the 2048 target and beyond.",
    tag: "Puzzle",
    difficulty: "Medium",
  },
  {
    slug: "minesweeper",
    name: "Minesweeper",
    description: "Reveal safe cells, flag mines, and clear the field.",
    tag: "Puzzle",
    difficulty: "Hard",
  },
  {
    slug: "pong",
    name: "Pong",
    description: "Reflex paddle duel against adaptive computer AI.",
    tag: "Classic",
    difficulty: "Easy",
  },
];

export function gameHref(slug: string): string {
  return `/games/${slug}`;
}
