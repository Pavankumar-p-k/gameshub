"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GAME_CATALOG, gameHref } from "@/config/gameCatalog";
import { supabase } from "@/lib/supabaseClient";

function readGuestFlag(): boolean {
  try { return window.localStorage.getItem("guest") === "true"; } catch { return false; }
}

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkAccess() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        setSession(data.session);
        setIsGuest(false);
        setChecking(false);
        return;
      }
      if (readGuestFlag()) {
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
        setIsGuest(true);
        setChecking(false);
        return;
      }
      router.replace("/login");
    });
    return () => { mounted = false; authListener.subscription.unsubscribe(); };
  }, [router]);

  const activeSlug = useMemo(() => pathname.split("/")[2] ?? "", [pathname]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const endGuest = () => {
    try { window.localStorage.removeItem("guest"); } catch { return; }
    setIsGuest(false);
    router.replace("/");
  };

  if (checking) {
    return (
      <div className="hub-shell flex min-h-screen items-center justify-center px-4">
        <div className="card w-full max-w-md p-10 text-center">
          <div className="spinner mx-auto mb-4" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p className="text-sm font-semibold tracking-widest text-[var(--text-muted)] uppercase">
            Loading Session
          </p>
          <p className="mt-2 text-[var(--text-primary)]">Preparing your game dashboard…</p>
        </div>
      </div>
    );
  }

  const activeGame = GAME_CATALOG.find((g) => g.slug === activeSlug);

  const SidebarContent = () => (
    <div className="flex flex-col h-full gap-0">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-[var(--border-soft)]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="navbar-logo-icon">🎮</div>
          <div>
            <p className="font-bold text-sm text-[var(--text-primary)] leading-tight">GameHub</p>
            <p className="text-xs text-[var(--text-muted)]">Arena</p>
          </div>
        </Link>
      </div>

      {/* Player info */}
      <div className="px-4 py-3 border-b border-[var(--border-soft)]">
        {session ? (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid var(--border-mid)" }}
            >
              {(session.user.email ?? "P")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {session.user.email}
              </p>
              <span className="badge badge-success" style={{ fontSize: "0.6rem" }}>Signed In</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border-soft)" }}
            >
              👤
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">Guest Session</p>
              <p className="text-xs text-[var(--text-dim)]">Scores not saved</p>
            </div>
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <div className="px-3 py-3 border-b border-[var(--border-soft)]">
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <div className="px-3 py-3 border-b border-[var(--border-soft)]">
        <p className="section-label mb-2 px-1">Navigation</p>
        <Link href="/" className="sidebar-item">
          <span className="sidebar-item-icon">🏠</span> Home
        </Link>
        <Link href="/leaderboard" className="sidebar-item">
          <span className="sidebar-item-icon">🏆</span> Leaderboard
        </Link>
      </div>

      {/* Games list */}
      <div className="px-3 py-3 flex-1 overflow-y-auto">
        <p className="section-label mb-2 px-1">Games</p>
        <div className="flex flex-col gap-0.5">
          {GAME_CATALOG.map((game) => {
            const isActive = activeSlug === game.slug;
            return (
              <Link
                key={game.slug}
                href={gameHref(game.slug)}
                className="sidebar-item"
                data-active={isActive ? "true" : "false"}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-item-icon">{game.icon}</span>
                <span className="flex-1 text-sm">{game.name}</span>
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-[var(--border-soft)] mt-auto">
        {session ? (
          <button
            type="button"
            onClick={logout}
            className="btn btn-danger w-full justify-center"
          >
            Logout
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={endGuest}
              className="btn btn-ghost w-full justify-center text-xs"
            >
              End Guest Session
            </button>
            <Link href="/signup" className="btn btn-primary w-full justify-center">
              Create Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="hub-shell min-h-screen flex">
      {/* ── Desktop sidebar ── */}
      <aside
        className="sidebar hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen overflow-y-auto page-enter"
        style={{ borderRadius: 0, borderTop: "none", borderBottom: "none", borderLeft: "none" }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="sidebar absolute left-0 top-0 bottom-0 w-72 overflow-y-auto z-10"
            style={{ borderRadius: 0, borderTop: "none", borderBottom: "none", borderLeft: "none" }}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile topbar */}
        <div
          className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border-soft)",
            backdropFilter: "blur(12px)",
          }}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <Link href="/" className="navbar-logo text-sm">
            <div className="navbar-logo-icon" style={{ width: 26, height: 26, fontSize: "0.85rem" }}>🎮</div>
            <span>GameHub</span>
          </Link>
          <Link href="/leaderboard" className="btn btn-ghost btn-sm">🏆</Link>
        </div>

        {/* Game header breadcrumb */}
        {activeGame && (
          <div
            className="px-6 py-3 flex items-center gap-3 border-b"
            style={{ borderColor: "var(--border-soft)", background: "var(--surface-1)" }}
          >
            <span className="text-xl">{activeGame.icon}</span>
            <div>
              <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight">{activeGame.name}</h1>
              <p className="text-xs text-[var(--text-muted)]">{activeGame.tag} · {activeGame.difficulty}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/leaderboard" className="btn btn-ghost btn-sm hide-mobile">
                🏆 Leaderboard
              </Link>
              {!session && (
                <Link href="/signup" className="btn btn-primary btn-sm">
                  Save Scores
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 page-enter">{children}</main>
      </div>
    </div>
  );
}
