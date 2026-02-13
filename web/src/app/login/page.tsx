"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    try {
      window.localStorage.setItem("guest", "true");
    } catch {
      return;
    }
    router.push("/games");
  }

  return (
    <main className="hub-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_1fr] page-enter">
        <section className="glass-panel rounded-3xl p-6 md:p-8">
          <span className="chip">Player Access</span>
          <h1 className="brand-title mt-4 text-3xl text-[var(--text-primary)] md:text-4xl">
            Welcome Back
          </h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Sign in to track scores, sync your progress, and use the upgraded GameHub dashboard.
          </p>
          <div className="mt-6">
            <ThemeToggle />
          </div>
          <div className="mt-6 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)] p-4">
            <p className="text-sm text-[var(--text-muted)]">No account yet?</p>
            <Link
              href="/signup"
              className="focus-ring mt-3 inline-flex rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
            >
              Create Account
            </Link>
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="focus-ring w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                placeholder="player@gamehub.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="focus-ring w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                placeholder="Enter password"
              />
            </div>
            {error ? (
              <p className="rounded-xl border border-[var(--danger)]/50 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="focus-ring w-full rounded-xl border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
          <button
            type="button"
            onClick={continueAsGuest}
            className="focus-ring mt-4 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
          >
            Continue as Guest
          </button>
        </section>
      </div>
    </main>
  );
}
