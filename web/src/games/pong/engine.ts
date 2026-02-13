export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GameState {
  playerY: number;
  aiY: number;
  ball: BallState;
  playerScore: number;
  aiScore: number;
  winner: "Player" | "AI" | null;
}

export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 360;
export const PADDLE_WIDTH = 12;
export const PADDLE_HEIGHT = 72;
export const BALL_RADIUS = 8;
const WIN_SCORE = 7;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function serveBall(toPlayer: boolean): BallState {
  const direction = toPlayer ? -1 : 1;
  return {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 5 * direction,
    vy: (Math.random() * 4 - 2) || 1.2,
  };
}

export function initializeGame(): GameState {
  return {
    playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    aiY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ball: serveBall(false),
    playerScore: 0,
    aiScore: 0,
    winner: null,
  };
}

export function movePlayer(state: GameState, direction: -1 | 1): GameState {
  return {
    ...state,
    playerY: clamp(state.playerY + direction * 20, 0, CANVAS_HEIGHT - PADDLE_HEIGHT),
  };
}

export function updateGame(state: GameState): GameState {
  if (state.winner) {
    return state;
  }

  const nextBall = { ...state.ball };
  nextBall.x += nextBall.vx;
  nextBall.y += nextBall.vy;

  if (nextBall.y - BALL_RADIUS <= 0 || nextBall.y + BALL_RADIUS >= CANVAS_HEIGHT) {
    nextBall.vy *= -1;
    nextBall.y = clamp(nextBall.y, BALL_RADIUS, CANVAS_HEIGHT - BALL_RADIUS);
  }

  const playerPaddleX = 24;
  const aiPaddleX = CANVAS_WIDTH - 24 - PADDLE_WIDTH;

  if (
    nextBall.x - BALL_RADIUS <= playerPaddleX + PADDLE_WIDTH &&
    nextBall.x > playerPaddleX &&
    nextBall.y >= state.playerY &&
    nextBall.y <= state.playerY + PADDLE_HEIGHT
  ) {
    nextBall.vx = Math.abs(nextBall.vx) * 1.04;
    nextBall.vy += ((nextBall.y - (state.playerY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2)) * 1.4;
  }

  if (
    nextBall.x + BALL_RADIUS >= aiPaddleX &&
    nextBall.x < aiPaddleX + PADDLE_WIDTH &&
    nextBall.y >= state.aiY &&
    nextBall.y <= state.aiY + PADDLE_HEIGHT
  ) {
    nextBall.vx = -Math.abs(nextBall.vx) * 1.04;
    nextBall.vy += ((nextBall.y - (state.aiY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2)) * 1.4;
  }

  let playerScore = state.playerScore;
  let aiScore = state.aiScore;
  let ball = nextBall;

  if (nextBall.x < -BALL_RADIUS) {
    aiScore += 1;
    ball = serveBall(false);
  } else if (nextBall.x > CANVAS_WIDTH + BALL_RADIUS) {
    playerScore += 1;
    ball = serveBall(true);
  }

  const winner = playerScore >= WIN_SCORE ? "Player" : aiScore >= WIN_SCORE ? "AI" : null;

  const aiCenter = state.aiY + PADDLE_HEIGHT / 2;
  const aiTarget = ball.y;
  const aiSpeed = 4.2;
  const aiDelta = clamp(aiTarget - aiCenter, -aiSpeed, aiSpeed);
  const aiY = clamp(state.aiY + aiDelta, 0, CANVAS_HEIGHT - PADDLE_HEIGHT);

  return {
    ...state,
    playerScore,
    aiScore,
    aiY,
    ball,
    winner,
  };
}
