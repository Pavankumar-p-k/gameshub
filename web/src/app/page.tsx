"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      // detect guest flag for lightweight access
      try {
        const guestFlag = localStorage.getItem("guest");
        setIsGuest(guestFlag === "true");
      } catch (e) {
        setIsGuest(false);
      }
    }
    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
      if (s) setIsGuest(false);
      if (!s) {
        try {
          const guestFlag = localStorage.getItem("guest");
          setIsGuest(guestFlag === "true");
        } catch (e) {
          setIsGuest(false);
        }
      }
    });

    return () => {
      mounted = false;
      try {
        // unsubscribe if available
        // @ts-ignore
        listener?.subscription?.unsubscribe?.();
        // @ts-ignore
        listener?.unsubscribe?.();
      } catch (e) {}
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    router.push("/");
  }

  function endGuestSession() {
    try {
      localStorage.removeItem("guest");
    } catch (e) {}
    setIsGuest(false);
    router.push("/");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-8 gap-6">
      <header className="w-full max-w-4xl flex items-center justify-between">
        <h1 className="text-3xl font-bold">GameHub</h1>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="text-sm text-gray-700">{session.user?.email}</span>
              <button onClick={handleLogout} className="px-3 py-1 border rounded">Logout</button>
            </>
          ) : isGuest ? (
            <>
              <span className="text-sm text-gray-700">Guest</span>
              <button onClick={endGuestSession} className="px-3 py-1 border rounded">End Guest Session</button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1 border rounded">Login</Link>
              <Link href="/signup" className="px-3 py-1 bg-indigo-600 text-white rounded">Sign up</Link>
            </>
          )}
        </div>
      </header>

      <section className="w-full max-w-4xl">
        <h2 className="text-xl font-semibold mb-4">Games</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {session || isGuest ? (
            <Link href="/games/sudoku" className="block p-4 border rounded hover:shadow">
              <h3 className="font-bold">Sudoku</h3>
              <p className="text-sm text-gray-600">Classic Sudoku puzzle</p>
            </Link>
          ) : (
            <div className="block p-4 border rounded hover:shadow">
              <h3 className="font-bold">Sudoku</h3>
              <p className="text-sm text-gray-600 mb-3">Classic Sudoku puzzle</p>
              <button
                onClick={() => {
                  try { localStorage.setItem("guest", "true"); } catch (e) {}
                  router.push("/games/sudoku");
                }}
                className="mt-2 inline-block px-3 py-1 bg-indigo-600 text-white rounded"
              >
                Play as Guest
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
