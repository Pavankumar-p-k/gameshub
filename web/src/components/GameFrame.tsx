"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { submitScore } from "@/lib/leaderboardService";

interface GameFrameProps {
  title: string;
  subtitle: string;
  status?: string;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** The numeric score to submit when game ends */
  score?: number;
  /** Set to true when the game is over to trigger score submission */
  gameOver?: boolean;
}

export function GameFrame({
  title,
  subtitle,
  status,
  actions,
  children,
  footer,
  score,
  gameOver,
}: GameFrameProps) {
  const pathname = usePathname();
  const [submitted, setSubmitted] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const lastScoreRef = useRef<number | null>(null);

  // Derive game slug from the URL path: /games/[slug]
  const gameSlug = pathname.split("/")[2] ?? "unknown";

  useEffect(() => {
    if (!gameOver || score === undefined || score <= 0) return;
    if (submitted && lastScoreRef.current === score) return;

    async function submit() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user ?? null;

        const playerName = user?.email
          ? user.email.split("@")[0]
          : "Guest";

        const result = await submitScore(
          {
            game_slug: gameSlug,
            score: score!,
            player_name: playerName,
          },
          user?.id ?? null
        );

        lastScoreRef.current = score!;
        setSubmitted(true);

        if (result.success) {
          setSubmitMsg(user ? `Score ${score} saved to leaderboard!` : `Score ${score} recorded (guest).`);
        } else {
          setSubmitMsg(null); // silent fail for guests / DB not set up
        }
      } catch {
        // silent — leaderboard is non-critical
        setSubmitMsg(null);
      }
    }

    submit();
  }, [gameOver, score, gameSlug, submitted]);

  // Reset submission flag when game restarts (gameOver flips false)
  useEffect(() => {
    if (!gameOver) {
      setSubmitted(false);
      setSubmitMsg(null);
      lastScoreRef.current = null;
    }
  }, [gameOver]);

  return (
    <div
      className="card"
      style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      {/* Header */}
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
        <div>
          <h1
            className="brand-title"
            style={{ fontSize: "1.6rem", color: "var(--text-primary)", lineHeight: 1.1 }}
          >
            {title}
          </h1>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {subtitle}
          </p>
          {status && (
            <span
              className="chip"
              style={{
                marginTop: "0.5rem",
                display: "inline-flex",
                color: gameOver ? "var(--danger)" : "var(--success)",
                borderColor: gameOver ? "color-mix(in srgb, var(--danger) 28%, transparent)" : "color-mix(in srgb, var(--success) 28%, transparent)",
                background: gameOver ? "color-mix(in srgb, var(--danger) 8%, transparent)" : "color-mix(in srgb, var(--success) 8%, transparent)",
              }}
            >
              {gameOver ? "⏹ " : "▶ "}{status}
            </span>
          )}
        </div>
        {actions && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
            {actions}
          </div>
        )}
      </header>

      {/* Score submit notification */}
      {submitMsg && (
        <div className="alert alert-success" style={{ fontSize: "0.8rem", padding: "0.5rem 0.85rem" }}>
          🏆 {submitMsg}
        </div>
      )}

      {/* Game content */}
      <section>{children}</section>

      {/* Footer */}
      {footer && (
        <footer style={{ fontSize: "0.8rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-soft)", paddingTop: "0.85rem" }}>
          {footer}
        </footer>
      )}
    </div>
  );
}

export default GameFrame;
