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
        <div className="flex items-center gap-3 bg-black p-2 rounded bg-white text-black">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white p-4 rounded shadow bg-black">
          {session || isGuest ? (
            <>
              <Link href="/games/sudoku" className="block p-4 border rounded hover:shadow">
                <h3 className="font-bold">Sudoku</h3>
                <p className="text-sm text-gray-600">Classic Sudoku puzzle</p>
              </Link>
              <Link href="/games/dinosaur" className="block p-4 border rounded hover:shadow">
                <h3 className="font-bold">Dinosaur</h3>
                <p className="text-sm text-gray-600">Chrome Dino Runner</p>
              </Link>
              <Link href="/games/wordle" className="block p-4 border rounded hover:shadow">
                <h3 className="font-bold">Wordle</h3>
                <p className="text-sm text-gray-600">Word guessing game</p>
              </Link>
              <Link href="/games/slither" className="block p-4 border rounded hover:shadow">
                <h3 className="font-bold">Slither</h3>
                <p className="text-sm text-gray-600">Snake game</p>
              </Link>
              <Link href="/games/krunker" className="block p-4 border rounded hover:shadow">
                <h3 className="font-bold">Krunker</h3>
                <p className="text-sm text-gray-600">2D Shooter</p>
              </Link>
              <Link href="/games/tictactoe" className="block p-4 border rounded hover:shadow">
                <h3 className="font-bold">Tic Tac Toe</h3>
                <p className="text-sm text-gray-600">Classic Tic Tac Toe</p>
              </Link>
              <Link href="/games/snake" className="block p-4 border rounded hover:shadow">
                <h3 className="font-bold">Snake</h3>
                <p className="text-sm text-gray-600">Snake game with score</p>
              </Link>
              <Link href="/games/tetris" className="block p-4 border rounded hover:shadow">
                <h3 className="font-bold">Tetris</h3>
                <p className="text-sm text-gray-600">Block puzzle game</p>
              </Link>
              <Link href="/games/2048" className="block p-4 border rounded hover:shadow">
                <h3 className="font-bold">2048</h3>
                <p className="text-sm text-gray-600">Number sliding game</p>
              </Link>
              <Link href="/games/minesweeper" className="block p-4 border rounded hover:shadow">
                <h3 className="font-bold">Minesweeper</h3>
                <p className="text-sm text-gray-600">Minefield puzzle</p>
              </Link>
              <Link href="/games/pong" className="block p-4 border rounded hover:shadow">
                <h3 className="font-bold">Pong</h3>
                <p className="text-sm text-gray-600">Classic Pong</p>
              </Link>
            </>
          ) : (
            <>
              <div className="block p-4 border rounded hover:shadow bg-gray-50">
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
              <div className="block p-4 border rounded hover:shadow bg-gray-50">
                <h3 className="font-bold">Dinosaur</h3>
                <p className="text-sm text-gray-600 mb-3">Chrome Dino Runner</p>
                <button
                  onClick={() => {
                    try { localStorage.setItem("guest", "true"); } catch (e) {}
                    router.push("/games/dinosaur");
                  }}
                  className="mt-2 inline-block px-3 py-1 bg-indigo-600 text-white rounded"
                >
                  Play as Guest
                </button>
              </div>
              <div className="block p-4 border rounded hover:shadow bg-gray-50">
                <h3 className="font-bold">Wordle</h3>
                <p className="text-sm text-gray-600 mb-3">Word guessing game</p>
                <button
                  onClick={() => {
                    try { localStorage.setItem("guest", "true"); } catch (e) {}
                    router.push("/games/wordle");
                  }}
                  className="mt-2 inline-block px-3 py-1 bg-indigo-600 text-white rounded"
                >
                  Play as Guest
                </button>
              </div>
              <div className="block p-4 border rounded hover:shadow bg-gray-50">
                <h3 className="font-bold">Slither</h3>
                <p className="text-sm text-gray-600 mb-3">Snake game</p>
                <button
                  onClick={() => {
                    try { localStorage.setItem("guest", "true"); } catch (e) {}
                    router.push("/games/slither");
                  }}
                  className="mt-2 inline-block px-3 py-1 bg-indigo-600 text-white rounded"
                >
                  Play as Guest
                </button>
              </div>
              <div className="block p-4 border rounded hover:shadow bg-gray-50">
                <h3 className="font-bold">Krunker</h3>
                <p className="text-sm text-gray-600 mb-3">2D Shooter</p>
                <button
                  onClick={() => {
                    try { localStorage.setItem("guest", "true"); } catch (e) {}
                    router.push("/games/krunker");
                  }}
                  className="mt-2 inline-block px-3 py-1 bg-indigo-600 text-white rounded"
                >
                  Play as Guest
                </button>
              </div>
              <div className="block p-4 border rounded hover:shadow bg-gray-50">
                <h3 className="font-bold">Tic Tac Toe</h3>
                <p className="text-sm text-gray-600 mb-3">Classic Tic Tac Toe</p>
                <button
                  onClick={() => {
                    try { localStorage.setItem("guest", "true"); } catch (e) {}
                    router.push("/games/tictactoe");
                  }}
                  className="mt-2 inline-block px-3 py-1 bg-indigo-600 text-white rounded"
                >
                  Play as Guest
                </button>
              </div>
              <div className="block p-4 border rounded hover:shadow bg-gray-50">
                <h3 className="font-bold">Snake</h3>
                <p className="text-sm text-gray-600 mb-3">Snake game with score</p>
                <button
                  onClick={() => {
                    try { localStorage.setItem("guest", "true"); } catch (e) {}
                    router.push("/games/snake");
                  }}
                  className="mt-2 inline-block px-3 py-1 bg-indigo-600 text-white rounded"
                >
                  Play as Guest
                </button>
              </div>
              <div className="block p-4 border rounded hover:shadow bg-gray-50">
                <h3 className="font-bold">Tetris</h3>
                <p className="text-sm text-gray-600 mb-3">Block puzzle game</p>
                <button
                  onClick={() => {
                    try { localStorage.setItem("guest", "true"); } catch (e) {}
                    router.push("/games/tetris");
                  }}
                  className="mt-2 inline-block px-3 py-1 bg-indigo-600 text-white rounded"
                >
                  Play as Guest
                </button>
              </div>
              <div className="block p-4 border rounded hover:shadow bg-gray-50">
                <h3 className="font-bold">2048</h3>
                <p className="text-sm text-gray-600 mb-3">Number sliding game</p>
                <button
                  onClick={() => {
                    try { localStorage.setItem("guest", "true"); } catch (e) {}
                    router.push("/games/2048");
                  }}
                  className="mt-2 inline-block px-3 py-1 bg-indigo-600 text-white rounded"
                >
                  Play as Guest
                </button>
              </div>
              <div className="block p-4 border rounded hover:shadow bg-gray-50">
                <h3 className="font-bold">Minesweeper</h3>
                <p className="text-sm text-gray-600 mb-3">Minefield puzzle</p>
                <button
                  onClick={() => {
                    try { localStorage.setItem("guest", "true"); } catch (e) {}
                    router.push("/games/minesweeper");
                  }}
                  className="mt-2 inline-block px-3 py-1 bg-indigo-600 text-white rounded"
                >
                  Play as Guest
                </button>
              </div>
              <div className="block p-4 border rounded hover:shadow bg-gray-50">
                <h3 className="font-bold">Pong</h3>
                <p className="text-sm text-gray-600 mb-3">Classic Pong</p>
                <button
                  onClick={() => {
                    try { localStorage.setItem("guest", "true"); } catch (e) {}
                    router.push("/games/pong");
                  }}
                  className="mt-2 inline-block px-3 py-1 bg-indigo-600 text-white rounded"
                >
                  Play as Guest
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
