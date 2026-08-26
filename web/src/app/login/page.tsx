"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    const userId = data.session?.user?.id;
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        email,
        last_login: new Date().toISOString(),
      });
    }

    router.push("/");
  }

  function continueAsGuest() {
    try { window.localStorage.setItem("guest", "true"); } catch { return; }
    router.push("/games");
  }

  return (
    <div className="hub-shell min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">
            <div className="navbar-logo-icon">🎮</div>
            <span>GameHub</span>
          </Link>
          <div className="navbar-actions">
            <Link href="/signup" className="btn btn-primary btn-sm">Create Account</Link>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 page-enter">
        <div className="w-full max-w-4xl grid gap-6 lg:grid-cols-2">

          {/* Left panel */}
          <div className="card p-8 flex flex-col justify-between">
            <div>
              <span className="badge badge-accent mb-4 inline-flex">🔐 Player Access</span>
              <h1 className="brand-title text-4xl text-[var(--text-primary)] mt-2 mb-3">
                Welcome<br />Back
              </h1>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
                Sign in to track your high scores, compete on the global leaderboard, and sync your progress.
              </p>
            </div>

            {/* Feature list */}
            <div className="mt-8 space-y-3">
              {[
                { icon: "🏆", text: "Save & track high scores" },
                { icon: "🌐", text: "Compete on global leaderboard" },
                { icon: "🎮", text: "Access all 11 games" },
                { icon: "⚡", text: "Instant session sync" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-sm text-[var(--text-secondary)]">{f.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)]">
              <p className="text-sm text-[var(--text-muted)]">No account yet?</p>
              <Link
                href="/signup"
                className="btn btn-primary mt-3 w-full justify-center"
              >
                Create Free Account →
              </Link>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="card p-8">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Sign In</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="input-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="player@gamehub.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="input-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="alert alert-danger">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-full justify-center"
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing In…</>
                ) : (
                  "Sign In →"
                )}
              </button>
            </form>

            <div className="relative my-6">
              <hr className="divider" />
              <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs text-[var(--text-dim)]"
                style={{ background: "var(--bg-secondary)" }}
              >
                or
              </span>
            </div>

            <button
              type="button"
              onClick={continueAsGuest}
              className="btn btn-secondary btn-lg w-full justify-center"
            >
              Continue as Guest
            </button>

            <p className="mt-4 text-center text-xs text-[var(--text-dim)]">
              Guest sessions cannot save scores or appear on the leaderboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
