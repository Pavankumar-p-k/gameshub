export interface GameState {
  playerY: number;
  aiY: number;
  ball: { x: number; y: number; dx: number; dy: number };
  playerScore: number;
  aiScore: number;
  gameOver: boolean;
}

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 400;
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 50;
export const BALL_SIZE = 5;

export function initializeGame(): GameState {
  return {
    playerY: 175,
    aiY: 175,
    ball: { x: 200, y: 200, dx: 5, dy: 5 },
    playerScore: 0,
    aiScore: 0,
    gameOver: false,
  };
}

export function updateGame(state: GameState): GameState {
  if (state.gameOver) return state;

  const newState = { ...state };
  newState.ball.x += newState.ball.dx;
  newState.ball.y += newState.ball.dy;

  // Ball collision with top/bottom
  if (newState.ball.y <= 0 || newState.ball.y >= CANVAS_HEIGHT) {
    newState.ball.dy = -newState.ball.dy;
  }

  // Ball collision with paddles
  if (
    (newState.ball.x <= 20 && newState.ball.x >= 10 && newState.ball.y >= newState.playerY && newState.ball.y <= newState.playerY + PADDLE_HEIGHT) ||
    (newState.ball.x >= 380 && newState.ball.x <= 390 && newState.ball.y >= newState.aiY && newState.ball.y <= newState.aiY + PADDLE_HEIGHT)
  ) {
    newState.ball.dx = -newState.ball.dx;
  }

  // Score
  if (newState.ball.x < 0) {
    newState.aiScore++;
    newState.ball = { x: 200, y: 200, dx: 5, dy: 5 };
  } else if (newState.ball.x > CANVAS_WIDTH) {
    newState.playerScore++;
    newState.ball = { x: 200, y: 200, dx: -5, dy: 5 };
  }

  // AI movement
  if (newState.aiY + 25 < newState.ball.y) newState.aiY = Math.min(newState.aiY + 3, CANVAS_HEIGHT - PADDLE_HEIGHT);
  else if (newState.aiY + 25 > newState.ball.y) newState.aiY = Math.max(newState.aiY - 3, 0);

  return newState;
}

export function movePlayer(state: GameState, direction: number): GameState {
  const newY = Math.max(0, Math.min(state.playerY + direction * 10, CANVAS_HEIGHT - PADDLE_HEIGHT));
  return { ...state, playerY: newY };
}