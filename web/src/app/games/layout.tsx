"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) {
        return;
      }

      if (data.session) {
        setSession(data.session);
        setIsGuest(false);
        setChecking(false);
        return;
      }

      if (readGuestFlag()) {
        setSession(null);
        setIsGuest(true);
        setChecking(false);
        return;
      }

      router.replace("/login");
    }

    checkAccess();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) {
        setSession(nextSession);
        setIsGuest(false);
        setChecking(false);
        return;
      }

      if (readGuestFlag()) {
        setSession(null);
        setIsGuest(true);
        setChecking(false);
        return;
      }

      router.replace("/login");
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const activeSlug = useMemo(() => pathname.split("/")[2] ?? "", [pathname]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const endGuest = () => {
    try {
      window.localStorage.removeItem("guest");
    } catch {
      return;
    }
    setIsGuest(false);
    router.replace("/");
  };

  if (checking) {
    return (
      <main className="hub-shell flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel w-full max-w-md rounded-3xl p-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">Session Check</p>
          <p className="mt-2 text-lg text-[var(--text-primary)]">Preparing your game dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="hub-shell min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[280px_1fr] page-enter">
        <aside className="glass-panel h-fit rounded-3xl p-5">
          <div className="space-y-3">
            <Link href="/" className="chip">
              Back to Hub
            </Link>
            <h2 className="brand-title text-2xl text-[var(--text-primary)]">GameHub Panel</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {session?.user.email ?? (isGuest ? "Guest session" : "Player")}
            </p>
          </div>

          <div className="mt-4">
            <ThemeToggle />
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Games</p>
            {GAME_CATALOG.map((game) => {
              const isActive = activeSlug === game.slug;
              return (
                <Link
                  key={game.slug}
                  href={gameHref(game.slug)}
                  className={`focus-ring block rounded-xl border px-3 py-2 text-sm transition ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--text-primary)]"
                      : "border-[var(--border-soft)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {game.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {session ? (
              <button
                type="button"
                onClick={logout}
                className="focus-ring rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
              >
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={endGuest}
                className="focus-ring rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
              >
                End Guest Session
              </button>
            )}
          </div>
        </aside>

        <section className="min-h-[70vh]">{children}</section>
      </div>
    </main>
  );
}
