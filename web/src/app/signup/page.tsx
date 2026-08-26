"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        email,
        username: username || email.split("@")[0],
      });
    }

    setMessage("Account created! Check your email for a confirmation link.");
    setTimeout(() => router.push("/login"), 2000);
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
            <Link href="/login" className="btn btn-secondary btn-sm">Already have an account</Link>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 page-enter">
        <div className="w-full max-w-4xl grid gap-6 lg:grid-cols-2">

          {/* Left — branding */}
          <div className="card p-8 flex flex-col justify-between">
            <div>
              <span className="badge badge-accent mb-4 inline-flex">✨ New Player</span>
              <h1 className="brand-title text-4xl text-[var(--text-primary)] mt-2 mb-3">
                Join the<br />Arena
              </h1>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
                Create your free account to save high scores, appear on the global
                leaderboard, and access all game features.
              </p>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { value: "11", label: "Games" },
                { value: "Free", label: "Always" },
                { value: "Global", label: "Leaderboard" },
                { value: "Instant", label: "Access" },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="stat-value text-xl" style={{ color: "var(--accent)" }}>
                    {s.value}
                  </div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)]">
              <p className="text-sm text-[var(--text-muted)]">Already have an account?</p>
              <Link href="/login" className="btn btn-secondary mt-3 w-full justify-center">
                Sign In →
              </Link>
            </div>
          </div>

          {/* Right — form */}
          <div className="card p-8">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Create Account</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="input-label" htmlFor="username">Display Name</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  placeholder="Your leaderboard name"
                  autoComplete="username"
                />
                <p className="mt-1 text-xs text-[var(--text-dim)]">
                  Shown on the leaderboard. Defaults to your email prefix.
                </p>
              </div>

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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="alert alert-danger">⚠️ {error}</div>
              )}

              {message && (
                <div className="alert alert-success">✅ {message}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-full justify-center"
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating…</>
                ) : (
                  "Create Account →"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[var(--text-dim)] leading-relaxed">
              By creating an account you agree to our terms of service.
              Your email is used only for authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
