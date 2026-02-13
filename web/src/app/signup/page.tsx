"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await supabase.from("profiles").upsert({ id: userId, email });
    }

    setMessage("Signup successful. Check your email for verification.");
    setTimeout(() => {
      router.push("/login");
    }, 1400);
  }

  return (
    <main className="hub-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_1fr] page-enter">
        <section className="glass-panel rounded-3xl p-6 md:p-8">
          <span className="chip">New Player</span>
          <h1 className="brand-title mt-4 text-3xl text-[var(--text-primary)] md:text-4xl">
            Create Your Arena Account
          </h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Save personal bests, build streaks, and access all redesigned game modes from one panel.
          </p>
          <div className="mt-6">
            <ThemeToggle />
          </div>
          <div className="mt-6 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)] p-4">
            <p className="text-sm text-[var(--text-muted)]">Already registered?</p>
            <Link
              href="/login"
              className="focus-ring mt-3 inline-flex rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
            >
              Go to Login
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
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="focus-ring w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                placeholder="At least 6 characters"
              />
            </div>
            {error ? (
              <p className="rounded-xl border border-[var(--danger)]/50 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-xl border border-[var(--success)]/40 bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--success)]">
                {message}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="focus-ring w-full rounded-xl border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
