export interface Point {
  x: number;
  y: number;
}

export interface GameState {
  snake: Point[];
  direction: Point;      // current direction
  nextDirection: Point;  // queued direction for next move
  food: Point;
  score: number;
  gameOver: boolean;
  speed: number;         // optional: increase speed as score grows
}

export const BOARD_WIDTH = 40;
export const BOARD_HEIGHT = 40;

/* ==========================
   Initialize a new game
========================== */
export function initializeGame(): GameState {
  return {
    snake: [{ x: 20, y: 20 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: spawnFood([{ x: 20, y: 20 }]),
    score: 0,
    gameOver: false,
    speed: 200, // initial move delay in ms
  };
}

/* ==========================
   Spawn food avoiding snake
========================== */
export function spawnFood(snake: Point[]): Point {
  let position: Point;
  do {
    position = {
      x: Math.floor(Math.random() * BOARD_WIDTH),
      y: Math.floor(Math.random() * BOARD_HEIGHT),
    };
  } while (snake.some(s => s.x === position.x && s.y === position.y));
  return position;
}

/* ==========================
   Change direction safely
========================== */
export function changeDirection(state: GameState, newDirection: Point): GameState {
  // prevent reversing
  if (state.direction.x + newDirection.x === 0 && state.direction.y + newDirection.y === 0) {
    return state;
  }
  return { ...state, nextDirection: newDirection };
}

/* ==========================
   Update game state
========================== */
export function updateGame(state: GameState): GameState {
  if (state.gameOver) return state;

  // Apply queued direction
  const direction = state.nextDirection;

  // Calculate new head
  const head: Point = {
    x: state.snake[0].x + direction.x,
    y: state.snake[0].y + direction.y,
  };

  // Collision with walls
  if (head.x < 0 || head.x >= BOARD_WIDTH || head.y < 0 || head.y >= BOARD_HEIGHT) {
    return { ...state, gameOver: true };
  }

  // Collision with self
  if (state.snake.some(s => s.x === head.x && s.y === head.y)) {
    return { ...state, gameOver: true };
  }

  // Add new head
  const newSnake = [head, ...state.snake];

  // Check food
  let newFood = state.food;
  let newScore = state.score;
  let newSpeed = state.speed;

  if (head.x === state.food.x && head.y === state.food.y) {
    newScore += 10;
    newFood = spawnFood(newSnake);

    // Optional: Increase speed every 50 points
    if (newScore % 50 === 0 && newSpeed > 50) {
      newSpeed -= 10;
    }
  } else {
    // Move snake: remove tail
    newSnake.pop();
  }

  return {
    ...state,
    snake: newSnake,
    direction,
    nextDirection: direction,
    food: newFood,
    score: newScore,
    speed: newSpeed,
  };
}
