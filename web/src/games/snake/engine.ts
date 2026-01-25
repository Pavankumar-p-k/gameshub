export interface Point {
  x: number;
  y: number;
}

export interface GameState {
  snake: Point[];
  direction: Point;
  food: Point;
  score: number;
  gameOver: boolean;
}

export const BOARD_WIDTH = 40;
export const BOARD_HEIGHT = 40;

export function initializeGame(): GameState {
  return {
    snake: [{ x: 20, y: 20 }],
    direction: { x: 1, y: 0 },
    food: { x: 10, y: 10 },
    score: 0,
    gameOver: false,
  };
}

export function updateGame(state: GameState): GameState {
  if (state.gameOver) return state;

  const head = {
    x: state.snake[0].x + state.direction.x,
    y: state.snake[0].y + state.direction.y,
  };

  // Check collision with walls
  if (head.x < 0 || head.x >= BOARD_WIDTH || head.y < 0 || head.y >= BOARD_HEIGHT) {
    return { ...state, gameOver: true };
  }

  // Check self collision
  if (state.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    return { ...state, gameOver: true };
  }

  const newSnake = [head, ...state.snake];

  let newFood = state.food;
  let newScore = state.score;

  // Check food
  if (head.x === state.food.x && head.y === state.food.y) {
    newScore += 10;
    newFood = {
      x: Math.floor(Math.random() * BOARD_WIDTH),
      y: Math.floor(Math.random() * BOARD_HEIGHT),
    };
  } else {
    newSnake.pop();
  }

  return {
    ...state,
    snake: newSnake,
    food: newFood,
    score: newScore,
  };
}

export function changeDirection(state: GameState, newDirection: Point): GameState {
  // Prevent reverse direction
  if (
    (newDirection.x === -state.direction.x && newDirection.y === -state.direction.y) ||
    (newDirection.x === state.direction.x && newDirection.y === state.direction.y)
  ) {
    return state;
  }
  return { ...state, direction: newDirection };
}