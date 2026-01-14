"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);

  // add theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // add accent color state
  const [accentColor, setAccentColor] = useState<string>("indigo");

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

  // initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "dark" || stored === "light") {
        setTheme(stored);
        applyTheme(stored);
      } else {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initial = prefersDark ? "dark" : "light";
        setTheme(initial);
        applyTheme(initial);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // initialize accent color from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("accentColor");
      if (stored) {
        setAccentColor(stored);
        applyColor(stored);
      }
    } catch (e) {}
  }, []);

  function applyTheme(t: "light" | "dark") {
    try {
      const root = document.documentElement;
      if (t === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } catch (e) {}
  }

  // apply accent color by setting a CSS variable on :root
  function applyColor(c: string) {
    try {
      document.documentElement.style.setProperty("--accent", c);
    } catch (e) {}
  }

  // changeColor persists and applies the color
  function changeColor(c: string) {
    try {
      localStorage.setItem("accentColor", c);
    } catch (e) {}
    setAccentColor(c);
    applyColor(c);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    setTheme(next);
    applyTheme(next);
  }

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
    // add background/text dark variants to show theme effect
    <main className="min-h-screen flex flex-col items-center justify-start p-8 gap-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="w-full max-w-4xl flex items-center justify-between">
        <h1 className="text-3xl font-bold">GameHub</h1>
        <div className="flex items-center gap-3">
          {/* Theme toggle button in top corner */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="p-2 rounded border hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === "dark" ? (
              // sun icon (light mode)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 15a5 5 0 100-10 5 5 0 000 10z" />
                <path d="M10 1v2M10 17v2M3 10H1M19 10h-2M4.2 4.2L2.8 2.8M17.2 17.2l1.4 1.4M4.2 15.8L2.8 17.2M17.2 2.8l1.4 1.4" stroke="currentColor" strokeWidth="0" />
              </svg>
            ) : (
              // moon icon (dark mode)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-200" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 116.707 2.707 7 7 0 0017.293 13.293z" />
              </svg>
            )}
          </button>

          {session ? (
            <>
              <span className="text-sm text-gray-700 dark:text-gray-300">{session.user?.email}</span>
              <button onClick={handleLogout} className="px-3 py-1 border rounded">Logout</button>
            </>
          ) : isGuest ? (
            <>
              <span className="text-sm text-gray-700 dark:text-gray-300">Guest</span>
              <button onClick={endGuestSession} className="px-3 py-1 border rounded">End Guest Session</button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1 border rounded">Login</Link>
              <Link href="/signup" className="px-3 py-1 bg-indigo-600 dark:bg-indigo-500 text-white rounded">Sign up</Link>
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
              <p className="text-sm text-gray-600 dark:text-gray-300">Classic Sudoku puzzle</p>
            </Link>
          ) : (
            <div className="block p-4 border rounded hover:shadow">
              <h3 className="font-bold">Sudoku</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Classic Sudoku puzzle</p>
              <button
                onClick={() => {
                  try { localStorage.setItem("guest", "true"); } catch (e) {}
                  router.push("/games/sudoku");
                }}
                className="mt-2 inline-block px-3 py-1 bg-indigo-600 dark:bg-indigo-500 text-white rounded"
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
