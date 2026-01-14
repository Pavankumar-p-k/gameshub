"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // On successful login, update or create profile row with last_login timestamp
    try {
      const userId = (data as any)?.user?.id;
      if (userId) {
        await supabase.from("profiles").upsert({ id: userId, email, last_login: new Date().toISOString() });
      }
    } catch (e) {
      console.error("Failed to upsert profile on login:", e);
    }
    router.push("/");
  }

  // Continue as guest: set a local flag and navigate to games
  function continueAsGuest() {
    try {
      localStorage.setItem("guest", "true");
    } catch (e) {}
    router.push("/games");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white text-black">
      <div className="w-full max-w-md bg-black rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-extrabold mb-4 text-white">Sign in to GameHub</h1>
        <p className="text-sm text-white mb-6">Access your saved games and progress. Or try a guest session.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="border p-2 rounded bg-transparent text-white placeholder-gray-400"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <input
            className="border p-2 rounded bg-transparent text-white placeholder-gray-400"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
          {error && <div className="text-red-600">{error}</div>}
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-lg p-2 font-medium disabled:opacity-50"
            disabled={loading}
          >
            Sign in
          </button>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-white">Don&apos;t have an account? <Link href="/signup" className="text-white">Create one</Link></p>
            <button
              type="button"
              onClick={continueAsGuest}
              className="text-sm text-white hover:underline"
            >
              Continue as Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
