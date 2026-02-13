"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/GameFrame";

interface Point {
  x: number;
  y: number;
}

interface SlitherState {
  snake: Point[];
  direction: Point;
  queuedDirection: Point;
  food: Point;
  score: number;
  speed: number;
  gameOver: boolean;
}

const COLS = 30;
const ROWS = 20;
const CELL_SIZE = 18;

function randomFood(snake: Point[]): Point {
  let candidate: Point = { x: 0, y: 0 };

  do {
    candidate = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y));

  return candidate;
}

function createInitialState(): SlitherState {
  const snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
  return {
    snake,
    direction: { x: 1, y: 0 },
    queuedDirection: { x: 1, y: 0 },
    food: randomFood(snake),
    score: 0,
    speed: 130,
    gameOver: false,
  };
}

function advanceGame(state: SlitherState): SlitherState {
  if (state.gameOver) {
    return state;
  }

  const direction = state.queuedDirection;
  const head = {
    x: (state.snake[0].x + direction.x + COLS) % COLS,
    y: (state.snake[0].y + direction.y + ROWS) % ROWS,
  };

  if (state.snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    return { ...state, gameOver: true };
  }

  const snake = [head, ...state.snake];
  let food = state.food;
  let score = state.score;
  let speed = state.speed;

  if (head.x === state.food.x && head.y === state.food.y) {
    score += 5;
    speed = Math.max(70, state.speed - 2);
    food = randomFood(snake);
  } else {
    snake.pop();
  }

  return {
    snake,
    direction,
    queuedDirection: direction,
    food,
    score,
    speed,
    gameOver: false,
  };
}

function canTurn(current: Point, next: Point): boolean {
  return !(current.x + next.x === 0 && current.y + next.y === 0);
}

export function SlitherGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [state, setState] = useState<SlitherState>(createInitialState);

  const resetGame = useCallback(() => {
    setState(createInitialState());
  }, []);

  const queueDirection = useCallback((nextDirection: Point) => {
    setState((previous) => {
      if (!canTurn(previous.direction, nextDirection)) {
        return previous;
      }

      return { ...previous, queuedDirection: nextDirection };
    });
  }, []);

  useEffect(() => {
    if (state.gameOver) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setState((previous) => advanceGame(previous));
    }, state.speed);

    return () => window.clearTimeout(timeoutId);
  }, [state]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
        event.preventDefault();
        queueDirection({ x: 0, y: -1 });
      } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
        event.preventDefault();
        queueDirection({ x: 0, y: 1 });
      } else if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        event.preventDefault();
        queueDirection({ x: -1, y: 0 });
      } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        event.preventDefault();
        queueDirection({ x: 1, y: 0 });
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [queueDirection, resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "rgba(225, 76, 255, 0.18)");
    gradient.addColorStop(1, "rgba(18, 23, 45, 0.8)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#22d3ee";
    state.snake.forEach((segment, index) => {
      context.fillRect(
        segment.x * CELL_SIZE,
        segment.y * CELL_SIZE,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
      if (index === 0) {
        context.fillStyle = "#67e8f9";
        context.fillRect(
          segment.x * CELL_SIZE + 3,
          segment.y * CELL_SIZE + 3,
          CELL_SIZE - 8,
          CELL_SIZE - 8
        );
        context.fillStyle = "#22d3ee";
      }
    });

    context.fillStyle = "#fb7185";
    context.fillRect(state.food.x * CELL_SIZE, state.food.y * CELL_SIZE, CELL_SIZE - 2, CELL_SIZE - 2);
  }, [state]);

  const onTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStart.current) {
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const threshold = 24;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      queueDirection({ x: dx > 0 ? 1 : -1, y: 0 });
    } else if (Math.abs(dy) > threshold) {
      queueDirection({ x: 0, y: dy > 0 ? 1 : -1 });
    }

    touchStart.current = null;
  };

  return (
    <GameFrame
      title="Slither"
      subtitle="Wrapped arena snake mode with rising speed."
      status={state.gameOver ? "Crashed" : "Hunting"}
      actions={
        <>
          <span className="chip">Score {state.score}</span>
          <span className="chip">Length {state.snake.length}</span>
          <button
            type="button"
            onClick={resetGame}
            className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
          >
            Restart
          </button>
        </>
      }
      footer="Controls: Arrow keys or WASD. Swipe on touch devices. Press R to restart."
    >
      <canvas
        ref={canvasRef}
        width={COLS * CELL_SIZE}
        height={ROWS * CELL_SIZE}
        className="mx-auto w-full max-w-[640px] rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      />
    </GameFrame>
  );
}

export default SlitherGame;
