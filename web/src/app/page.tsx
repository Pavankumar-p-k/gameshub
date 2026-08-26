"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LeaderboardWidget } from "@/components/LeaderboardWidget";
import { GAME_CATALOG, gameHref } from "@/config/gameCatalog";
import { supabase } from "@/lib/supabaseClient";

function readGuestFlag(): boolean {
  try { return window.localStorage.getItem("guest") === "true"; } catch { return false; }
}

function getDifficultyBadgeStyle(difficulty: string): React.CSSProperties {
  const colors: Record<string, string> = {
    Easy: "var(--success)",
    Medium: "var(--gold)",
    Hard: "var(--danger)",
  };
  const c = colors[difficulty] ?? "var(--text-muted)";
  return {
    color: c,
    background: `color-mix(in srgb, ${c} 12%, transparent)`,
    border: `1px solid color-mix(in srgb, ${c} 24%, transparent)`,
    borderRadius: "var(--radius-pill)",
    padding: "0.15rem 0.5rem",
    fontSize: "0.66rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    display: "inline-flex",
    alignItems: "center",
  };
}

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Arcade" | "Puzzle" | "Classic" | "Word" | "Action">("All");

  useEffect(() => {
    let mounted = true;
    async function syncSession() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setIsGuest(data.session ? false : readGuestFlag());
      setLoading(false);
    }
    syncSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsGuest(nextSession ? false : readGuestFlag());
    });
    return () => { mounted = false; authListener.subscription.unsubscribe(); };
  }, []);

  const startGuestSession = () => {
    try { window.localStorage.setItem("guest", "true"); } catch { return; }
    setIsGuest(true);
  };

  const endGuestSession = () => {
    try { window.localStorage.removeItem("guest"); } catch { return; }
    setIsGuest(false);
    router.push("/");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.push("/");
  };

  const launchGame = (slug: string) => {
    if (!session && !isGuest) startGuestSession();
    router.push(gameHref(slug));
  };

  const TAGS = ["All", "Arcade", "Puzzle", "Classic", "Word", "Action"] as const;
  const filteredGames = filter === "All"
    ? GAME_CATALOG
    : GAME_CATALOG.filter((g) => g.tag === filter);

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
            <Link href="/" className="navbar-link" data-active="true">Home</Link>
            <Link href="/games" className="navbar-link">Games</Link>
            <Link href="/leaderboard" className="navbar-link">Leaderboard</Link>
          </div>

          <div className="navbar-actions">
            <ThemeToggle />
            {loading ? null : session ? (
              <>
                <span className="chip hide-mobile">{session.user.email?.split("@")[0]}</span>
                <Link href="/games" className="btn btn-primary btn-sm">Dashboard</Link>
                <button type="button" onClick={logout} className="btn btn-ghost btn-sm">
                  Logout
                </button>
              </>
            ) : isGuest ? (
              <>
                <span className="chip">Guest</span>
                <button type="button" onClick={endGuestSession} className="btn btn-ghost btn-sm">
                  Exit
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary btn-sm">Login</Link>
                <Link href="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 50% -20%, color-mix(in srgb, var(--accent) 16%, transparent), transparent)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 md:px-8 page-enter relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge badge-accent">🟢 Live Platform</span>
              <span className="chip">{GAME_CATALOG.length} Games Available</span>
            </div>
            <h1 className="brand-title text-5xl leading-none text-[var(--text-primary)] md:text-7xl">
              GameHub<br />
              <span style={{ color: "var(--accent)" }}>Arena</span>
            </h1>
            <p className="mt-5 text-base text-[var(--text-secondary)] max-w-xl leading-relaxed">
              Play classic arcade, puzzle, and strategy games. Create an account to save
              high scores and compete on the global leaderboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {session ? (
                <Link href="/games" className="btn btn-primary btn-lg">
                  Open Dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="btn btn-primary btn-lg pulse-glow">
                    Create Free Account
                  </Link>
                  <button
                    type="button"
                    onClick={startGuestSession}
                    className="btn btn-secondary btn-lg"
                  >
                    Quick Play (Guest)
                  </button>
                </>
              )}
              <Link href="/leaderboard" className="btn btn-ghost btn-lg">
                🏆 Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

          {/* ── Games section ── */}
          <section>
            {/* Filter tabs */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Games Library</h2>
              <div className="flex flex-wrap gap-1.5">
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setFilter(tag)}
                    className="btn btn-sm"
                    style={
                      filter === tag
                        ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                        : { background: "var(--surface-2)", borderColor: "var(--border-soft)", color: "var(--text-muted)" }
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
              {filteredGames.map((game) => (
                <article
                  key={game.slug}
                  className="game-card"
                  onClick={() => launchGame(game.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && launchGame(game.slug)}
                  style={{ "--game-color": game.color } as React.CSSProperties}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="game-card-icon"
                      style={{
                        background: `color-mix(in srgb, ${game.color} 12%, var(--surface-3))`,
                        border: `1px solid color-mix(in srgb, ${game.color} 22%, transparent)`,
                      }}
                    >
                      {game.icon}
                    </div>
                    <span className="chip">{game.tag}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)] leading-tight">
                      {game.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-[var(--text-muted)] leading-relaxed">
                      {game.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                    <span style={getDifficultyBadgeStyle(game.difficulty)}>
                      {game.difficulty}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        background: `color-mix(in srgb, ${game.color} 14%, var(--surface-3))`,
                        borderColor: `color-mix(in srgb, ${game.color} 30%, transparent)`,
                        color: game.color,
                      }}
                      onClick={(e) => { e.stopPropagation(); launchGame(game.slug); }}
                    >
                      Play →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ── Right sidebar ── */}
          <aside className="flex flex-col gap-5">
            {/* Account status card */}
            <div className="sidebar p-5">
              <p className="section-label mb-3">Account</p>
              {loading ? (
                <div className="spinner mx-auto" />
              ) : session ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                      style={{ background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid var(--border-mid)" }}
                    >
                      {(session.user.email ?? "P")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                        {session.user.email}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">Signed in</p>
                    </div>
                  </div>
                  <Link href="/games" className="btn btn-primary w-full justify-center">
                    Open Dashboard →
                  </Link>
                  <button type="button" onClick={logout} className="btn btn-secondary w-full justify-center">
                    Logout
                  </button>
                </div>
              ) : isGuest ? (
                <div className="space-y-3">
                  <div className="badge badge-accent text-center w-full justify-center py-2">
                    🟡 Guest Session Active
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Scores won't be saved. Create an account to track your progress.
                  </p>
                  <Link href="/signup" className="btn btn-primary w-full justify-center">
                    Create Account
                  </Link>
                  <button type="button" onClick={endGuestSession} className="btn btn-ghost w-full justify-center">
                    End Guest Session
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Sign in to save scores and compete globally.
                  </p>
                  <Link href="/login" className="btn btn-secondary w-full justify-center">
                    Login
                  </Link>
                  <Link href="/signup" className="btn btn-primary w-full justify-center">
                    Create Account
                  </Link>
                  <button
                    type="button"
                    onClick={startGuestSession}
                    className="btn btn-ghost w-full justify-center text-xs"
                  >
                    Continue as Guest
                  </button>
                </div>
              )}
            </div>

            {/* Leaderboard widget */}
            <LeaderboardWidget
              limit={10}
              title="Global Top 10"
              showViewAll={true}
              compact={false}
            />

            {/* Quick links */}
            <div className="sidebar p-4">
              <p className="section-label mb-3">Quick Links</p>
              <div className="flex flex-col gap-1">
                <Link href="/games" className="sidebar-item">
                  <span className="sidebar-item-icon">🎮</span> Games Directory
                </Link>
                <Link href="/leaderboard" className="sidebar-item">
                  <span className="sidebar-item-icon">🏆</span> Full Leaderboard
                </Link>
                <Link href="/login" className="sidebar-item">
                  <span className="sidebar-item-icon">🔐</span> Account Login
                </Link>
                <Link href="/signup" className="sidebar-item">
                  <span className="sidebar-item-icon">✨</span> Create Account
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
