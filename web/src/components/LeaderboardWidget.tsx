"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getTopScores, getGlobalTopScores, type LeaderboardEntry } from "@/lib/leaderboardService";
import { GAME_CATALOG } from "@/config/gameCatalog";

interface LeaderboardWidgetProps {
  /** If provided, shows scores only for that game. Otherwise shows global top. */
  gameSlug?: string;
  limit?: number;
  /** Display title override */
  title?: string;
  /** Show "View Full Leaderboard" link */
  showViewAll?: boolean;
  /** Compact row height */
  compact?: boolean;
}

const MEDAL = ["🥇", "🥈", "🥉"];

function formatScore(score: number): string {
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1)}M`;
  if (score >= 1_000) return `${(score / 1_000).toFixed(1)}K`;
  return score.toString();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function getGameIcon(slug: string): string {
  return GAME_CATALOG.find((g) => g.slug === slug)?.icon ?? "🎮";
}

function getGameName(slug: string): string {
  return GAME_CATALOG.find((g) => g.slug === slug)?.name ?? slug;
}

export function LeaderboardWidget({
  gameSlug,
  limit = 10,
  title,
  showViewAll = true,
  compact = false,
}: LeaderboardWidgetProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = gameSlug
        ? await getTopScores(gameSlug, limit)
        : await getGlobalTopScores(limit);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [gameSlug, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData, lastRefresh]);

  const displayTitle =
    title ?? (gameSlug ? `${getGameName(gameSlug)} Top Scores` : "Global Leaderboard");

  return (
    <div className="card flex flex-col gap-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-soft)]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <h3 className="text-sm font-bold tracking-wide text-[var(--text-primary)] uppercase" style={{ letterSpacing: "0.1em" }}>
            {displayTitle}
          </h3>
        </div>
        <button
          onClick={() => setLastRefresh(Date.now())}
          className="btn btn-ghost btn-sm"
          title="Refresh"
          type="button"
        >
          {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "↻"}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col">
        {loading ? (
          <div className="flex flex-col gap-2 px-4 py-4">
            {Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
              <div
                key={i}
                className="h-9 rounded-lg animate-pulse"
                style={{
                  background: "var(--surface-3)",
                  opacity: 1 - i * 0.15,
                }}
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-2xl mb-2">🎮</p>
            <p className="text-sm text-[var(--text-muted)]">No scores yet.</p>
            <p className="text-xs text-[var(--text-dim)] mt-1">Be the first to play!</p>
          </div>
        ) : (
          <div className={`flex flex-col ${compact ? "gap-0" : "gap-0.5"} px-2 py-2`}>
            {entries.map((entry, idx) => {
              const rank = idx + 1;
              const rankAttr = rank <= 3 ? String(rank) : "other";
              return (
                <div key={entry.id} className="lb-row" data-rank={rankAttr}>
                  {/* Rank */}
                  <div className="lb-rank flex items-center justify-center" data-rank={rankAttr}>
                    {rank <= 3 ? (
                      <span className="text-base">{MEDAL[rank - 1]}</span>
                    ) : (
                      <span className="text-xs font-bold" style={{ color: "var(--text-dim)" }}>
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Player + game info */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate leading-tight">
                      {entry.player_name}
                    </p>
                    {!gameSlug && (
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                        <span>{getGameIcon(entry.game_slug)}</span>
                        <span className="truncate">{getGameName(entry.game_slug)}</span>
                      </p>
                    )}
                    {!compact && (
                      <p className="text-xs text-[var(--text-dim)] mt-0.5">{timeAgo(entry.created_at)}</p>
                    )}
                  </div>

                  {/* Score */}
                  <div className="lb-score">{formatScore(entry.score)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {showViewAll && (
        <div className="px-4 py-3 border-t border-[var(--border-soft)]">
          <Link
            href="/leaderboard"
            className="btn btn-secondary btn-sm w-full justify-center"
          >
            View Full Leaderboard →
          </Link>
        </div>
      )}
    </div>
  );
}

export default LeaderboardWidget;
