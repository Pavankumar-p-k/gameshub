"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // If user created successfully, also create a profile row in Supabase table 'profiles'
    try {
      const userId = (data as any)?.user?.id;
      if (userId) {
        await supabase.from("profiles").upsert({ id: userId, email });
      }
    } catch (e) {
      // non-fatal: profile creation failed, but auth succeeded
      console.error("Failed to create profile row:", e);
    }
    setMessage("Check your email for confirmation (if required). Redirecting...");
    setTimeout(() => router.push("/"), 1200);
  }

  // Allow users to try the app as a guest without creating an account
  function continueAsGuest() {
    try {
      localStorage.setItem("guest", "true");
    } catch (e) {}
    try {
      const guestId = typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `guest_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      supabase.from("guest_sessions").insert({ id: guestId, started_at: new Date().toISOString() }).catch(() => {});
    } catch (e) {}
    router.push("/games/sudoku");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black text-white">
      <div className="w-full max-w-md bg-black rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-extrabold mb-4 text-white">Create your GameHub account</h1>
        <p className="text-sm text-white mb-6">Register to save progress and access your profile across devices.</p>
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
          {message && <div className="text-green-600">{message}</div>}
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-lg p-2 font-medium disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-white">Already have an account? <Link href="/login" className="text-white">Log in</Link></p>
          <button onClick={continueAsGuest} className="text-sm text-white hover:underline">Try as Guest</button>
        </div>
      </div>
    </div>
  );
}

