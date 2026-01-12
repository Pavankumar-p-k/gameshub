"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  // allow guest sessions via localStorage flag
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        // authenticated user
        setIsGuest(false);
        setChecking(false);
        return;
      }

      // allow a lightweight guest view using localStorage flag
      const guestFlag = typeof window !== "undefined" ? localStorage.getItem("guest") : null;
      if (guestFlag === "true") {
        setIsGuest(true);
        setChecking(false);
        return;
      }

      // no session and not a guest -> require login
      router.push("/login");
    }

    check();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // If auth state changes to logged out and no guest flag, force login
      const guestFlag = typeof window !== "undefined" ? localStorage.getItem("guest") : null;
      if (!session && guestFlag !== "true") {
        router.push("/login");
      }
      if (session) {
        setIsGuest(false);
      }
    });

    return () => {
      mounted = false;
      // unsubscribe if available
      try {
        // listener may have subscription or unsubscribe
        // @ts-ignore
        listener?.subscription?.unsubscribe?.();
        // @ts-ignore
        listener?.unsubscribe?.();
      } catch (e) {
        // ignore
      }
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">Checking session...</div>
    );
  }

  return <div>{children}</div>;
}
