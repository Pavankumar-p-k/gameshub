"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GAME_CATALOG, gameHref } from "@/config/gameCatalog";
import { supabase } from "@/lib/supabaseClient";

function readGuestFlag(): boolean {
  try {
    return window.localStorage.getItem("guest") === "true";
  } catch {
    return false;
  }
}

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function syncSession() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) {
        return;
      }

      setSession(data.session);
      setIsGuest(data.session ? false : readGuestFlag());
      setLoading(false);
    }

    syncSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsGuest(nextSession ? false : readGuestFlag());
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const startGuestSession = () => {
    try {
      window.localStorage.setItem("guest", "true");
    } catch {
      return;
    }
    setIsGuest(true);
  };

  const endGuestSession = () => {
    try {
      window.localStorage.removeItem("guest");
    } catch {
      return;
    }
    setIsGuest(false);
    router.push("/");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.push("/");
  };

  const launchGame = (slug: string) => {
    if (!session && !isGuest) {
      startGuestSession();
    }
    router.push(gameHref(slug));
  };

  return (
    <main className="hub-shell min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 page-enter">
        <header className="glass-panel rounded-3xl p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="chip">Online Platform</span>
              <h1 className="brand-title text-3xl leading-tight text-[var(--text-primary)] md:text-5xl">
                GameHub Arena
              </h1>
              <p className="max-w-2xl text-sm text-[var(--text-muted)] md:text-base">
                Play instantly across classic arcade, puzzle, and strategy experiences.
                The hub now includes stronger game loops, cleaner controls, and themed UI modes.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <ThemeToggle />
              <div className="flex flex-wrap gap-2">
                {session ? (
                  <>
                    <span className="chip">{session.user.email ?? "Signed in player"}</span>
                    <button
                      type="button"
                      onClick={logout}
                      className="focus-ring rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                    >
                      Logout
                    </button>
                  </>
                ) : isGuest ? (
                  <>
                    <span className="chip">Guest Session Active</span>
                    <button
                      type="button"
                      onClick={endGuestSession}
                      className="focus-ring rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                    >
                      End Guest
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="focus-ring rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
                    >
                      Create Account
                    </Link>
                    <button
                      type="button"
                      onClick={startGuestSession}
                      className="focus-ring rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                    >
                      Quick Play
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="glass-panel flex flex-col gap-4 rounded-3xl p-5">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Platform Status</p>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                {loading ? "Syncing..." : session ? "Signed In" : isGuest ? "Guest Mode" : "Visitor"}
              </h2>
            </div>
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)] p-4">
              <p className="text-sm text-[var(--text-muted)]">
                Total games
                <span className="mt-2 block text-3xl font-semibold text-[var(--text-primary)]">
                  {GAME_CATALOG.length}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Quick Links</p>
              <Link
                href="/games"
                className="focus-ring block rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
              >
                Open Games Directory
              </Link>
              <Link
                href="/login"
                className="focus-ring block rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
              >
                Account Access
              </Link>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">Games Library</h2>
              <span className="chip">Keyboard + Mobile Controls</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
              {GAME_CATALOG.map((game) => (
                <article key={game.slug} className="glass-tile rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{game.name}</h3>
                    <span className="chip">{game.tag}</span>
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-muted)]">{game.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      Difficulty {game.difficulty}
                    </span>
                    <button
                      type="button"
                      onClick={() => launchGame(game.slug)}
                      className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
                    >
                      Play
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
