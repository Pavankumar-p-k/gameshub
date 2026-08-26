"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getTopScores, getGlobalTopScores, type LeaderboardEntry } from "@/lib/leaderboardService";
import { GAME_CATALOG, gameHref } from "@/config/gameCatalog";

const MEDAL = ["🥇", "🥈", "🥉"];
const ALL_TAB = "__global__";

function formatScore(score: number): string {
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1)}M`;
  if (score >= 1_000) return `${(score / 1_000).toFixed(1)}K`;
  return score.toLocaleString();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function getGameIcon(slug: string): string {
  return GAME_CATALOG.find((g) => g.slug === slug)?.icon ?? "🎮";
}

function getGameName(slug: string): string {
  return GAME_CATALOG.find((g) => g.slug === slug)?.name ?? slug;
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "Easy": return "var(--success)";
    case "Medium": return "var(--gold)";
    case "Hard": return "var(--danger)";
    default: return "var(--text-muted)";
  }
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data =
        activeTab === ALL_TAB
          ? await getGlobalTopScores(50)
          : await getTopScores(activeTab, 50);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeGame = GAME_CATALOG.find((g) => g.slug === activeTab);

  return (
    <div className="hub-shell min-h-screen">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">
            <div className="navbar-logo-icon">🎮</div>
            <span>GameHub</span>
          </Link>
          <div className="navbar-nav hide-mobile">
            <Link href="/" className="navbar-link">Home</Link>
            <Link href="/games" className="navbar-link">Games</Link>
            <Link href="/leaderboard" className="navbar-link" data-active="true">Leaderboard</Link>
          </div>
          <div className="navbar-actions">
            <Link href="/login" className="btn btn-secondary btn-sm">Login</Link>
            <Link href="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 page-enter">
        {/* ── Page Header ── */}
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-label mb-1">Rankings</p>
            <h1 className="brand-title text-4xl text-[var(--text-primary)] md:text-5xl">
              Leaderboard
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)] max-w-xl">
              Top scores across all games. Log in to save your scores and compete globally.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="btn btn-secondary"
            >
              {loading ? <span className="spinner" /> : "↻"} Refresh
            </button>
            <Link href="/games" className="btn btn-primary">
              Play Games →
            </Link>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 gap-3 mb-8 sm:grid-cols-4">
          <div className="stat-card">
            <div className="stat-value">{GAME_CATALOG.length}</div>
            <div className="stat-label">Games</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{entries.length}</div>
            <div className="stat-label">Scores Loaded</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {entries.length > 0 ? formatScore(Math.max(...entries.map((e) => e.score))) : "—"}
            </div>
            <div className="stat-label">Top Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {new Set(entries.map((e) => e.player_name)).size || "—"}
            </div>
            <div className="stat-label">Players</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* ── Game selector sidebar ── */}
          <aside className="sidebar p-4 h-fit">
            <p className="section-label mb-3 px-1">Filter by Game</p>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                className="sidebar-item"
                data-active={activeTab === ALL_TAB ? "true" : "false"}
                onClick={() => setActiveTab(ALL_TAB)}
              >
                <span className="sidebar-item-icon">🌐</span>
                <span className="flex-1 text-left">All Games</span>
                {activeTab === ALL_TAB && (
                  <span className="badge badge-accent">Active</span>
                )}
              </button>
              <hr className="divider my-2" />
              {GAME_CATALOG.map((game) => (
                <button
                  key={game.slug}
                  type="button"
                  className="sidebar-item"
                  data-active={activeTab === game.slug ? "true" : "false"}
                  onClick={() => setActiveTab(game.slug)}
                >
                  <span className="sidebar-item-icon">{game.icon}</span>
                  <span className="flex-1 text-left text-sm">{game.name}</span>
                  <span
                    className="badge text-xs"
                    style={{
                      color: getDifficultyColor(game.difficulty),
                      background: `color-mix(in srgb, ${getDifficultyColor(game.difficulty)} 12%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${getDifficultyColor(game.difficulty)} 24%, transparent)`,
                    }}
                  >
                    {game.difficulty}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* ── Main leaderboard table ── */}
          <main>
            <div className="card overflow-hidden">
              {/* Table header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-soft)]">
                <div className="flex items-center gap-3">
                  {activeTab !== ALL_TAB && activeGame ? (
                    <>
                      <span className="text-3xl">{activeGame.icon}</span>
                      <div>
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">{activeGame.name}</h2>
                        <p className="text-xs text-[var(--text-muted)]">{activeGame.description}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl">🏆</span>
                      <div>
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">Global Rankings</h2>
                        <p className="text-xs text-[var(--text-muted)]">Best scores across all games</p>
                      </div>
                    </>
                  )}
                </div>
                {activeTab !== ALL_TAB && (
                  <Link href={gameHref(activeTab)} className="btn btn-primary btn-sm">
                    Play Now →
                  </Link>
                )}
              </div>

              {/* Column headers */}
              <div
                className="grid px-6 py-2 border-b border-[var(--border-soft)]"
                style={{
                  gridTemplateColumns: activeTab === ALL_TAB ? "3rem 1fr 140px auto" : "3rem 1fr auto",
                  gap: "0.75rem",
                }}
              >
                <div className="section-label text-center">#</div>
                <div className="section-label">Player</div>
                {activeTab === ALL_TAB && <div className="section-label">Game</div>}
                <div className="section-label text-right">Score</div>
              </div>

              {/* Rows */}
              {loading ? (
                <div className="flex flex-col gap-2 px-4 py-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 rounded-xl animate-pulse"
                      style={{ background: "var(--surface-3)", opacity: 1 - i * 0.1 }}
                    />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-5xl mb-4">🎮</p>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">No scores yet</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1 mb-6">
                    Be the first to set a high score!
                  </p>
                  <Link
                    href={activeTab !== ALL_TAB ? gameHref(activeTab) : "/games"}
                    className="btn btn-primary"
                  >
                    Play Now →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col py-2">
                  {entries.map((entry, idx) => {
                    const rank = idx + 1;
                    const rankAttr = rank <= 3 ? String(rank) : "other";
                    const gameIcon = getGameIcon(entry.game_slug);
                    const gameName = getGameName(entry.game_slug);

                    return (
                      <div
                        key={entry.id}
                        className="grid items-center px-4 py-3 mx-2 my-0.5 rounded-xl border border-transparent transition-all hover:border-[var(--border-soft)] hover:bg-[var(--surface-hover)]"
                        style={{
                          gridTemplateColumns: activeTab === ALL_TAB ? "3rem 1fr 140px auto" : "3rem 1fr auto",
                          gap: "0.75rem",
                          background: rank === 1
                            ? "color-mix(in srgb, var(--gold) 7%, transparent)"
                            : rank === 2
                            ? "color-mix(in srgb, var(--silver) 5%, transparent)"
                            : rank === 3
                            ? "color-mix(in srgb, var(--bronze) 6%, transparent)"
                            : undefined,
                          borderColor: rank === 1
                            ? "color-mix(in srgb, var(--gold) 18%, transparent)"
                            : rank === 2
                            ? "color-mix(in srgb, var(--silver) 14%, transparent)"
                            : rank === 3
                            ? "color-mix(in srgb, var(--bronze) 18%, transparent)"
                            : undefined,
                        }}
                      >
                        {/* Rank */}
                        <div className="flex items-center justify-center">
                          {rank <= 3 ? (
                            <span className="text-xl">{MEDAL[rank - 1]}</span>
                          ) : (
                            <span
                              className="text-xs font-bold"
                              style={{ color: "var(--text-dim)" }}
                            >
                              #{rank}
                            </span>
                          )}
                        </div>

                        {/* Player */}
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--text-primary)] truncate leading-tight">
                            {entry.player_name}
                            {rank === 1 && (
                              <span className="ml-2 badge badge-gold">Champion</span>
                            )}
                          </p>
                          <p className="text-xs text-[var(--text-dim)] mt-0.5">
                            {timeAgo(entry.created_at)}
                          </p>
                        </div>

                        {/* Game (global only) */}
                        {activeTab === ALL_TAB && (
                          <Link
                            href={gameHref(entry.game_slug)}
                            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
                          >
                            <span className="text-base flex-shrink-0">{gameIcon}</span>
                            <span className="text-sm text-[var(--text-secondary)] truncate">
                              {gameName}
                            </span>
                          </Link>
                        )}

                        {/* Score */}
                        <div
                          className="text-right font-extrabold text-lg tabular-nums"
                          style={{
                            color: rank === 1
                              ? "var(--gold-light)"
                              : rank === 2
                              ? "var(--silver)"
                              : rank === 3
                              ? "var(--bronze)"
                              : "var(--text-primary)",
                          }}
                        >
                          {formatScore(entry.score)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              {!loading && entries.length > 0 && (
                <div className="px-6 py-3 border-t border-[var(--border-soft)] flex items-center justify-between">
                  <p className="text-xs text-[var(--text-dim)]">
                    Showing {entries.length} score{entries.length !== 1 ? "s" : ""}
                  </p>
                  <Link href="/games" className="btn btn-secondary btn-sm">
                    Play to Climb Rankings →
                  </Link>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ── CTA footer ── */}
        <div className="mt-10 card p-8 text-center">
          <h2 className="brand-title text-2xl text-[var(--text-primary)] mb-2">
            Want to see your name here?
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-6 max-w-md mx-auto">
            Create a free account to save your scores permanently and compete on the global leaderboard.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/signup" className="btn btn-primary btn-lg">
              Create Account — Free
            </Link>
            <Link href="/games" className="btn btn-secondary btn-lg">
              Play as Guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
