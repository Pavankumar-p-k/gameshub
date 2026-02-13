"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const THEME_OPTIONS = [
  { id: "arcade", label: "Arcade" },
  { id: "midnight", label: "Midnight" },
  { id: "sunset", label: "Sunset" },
] as const;

export type ThemeName = (typeof THEME_OPTIONS)[number]["id"];

interface ThemeContextType {
  theme: ThemeName;
  options: readonly { id: ThemeName; label: string }[];
  setTheme: (theme: ThemeName) => void;
  cycleTheme: () => void;
}

const STORAGE_KEY = "gamehub-theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function isThemeName(value: string | null): value is ThemeName {
  return Boolean(value && THEME_OPTIONS.some((option) => option.id === value));
}

function resolveInitialTheme(): ThemeName {
  if (typeof window === "undefined") {
    return "arcade";
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (isThemeName(storedTheme)) {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "midnight" : "arcade";
}

function applyTheme(theme: ThemeName): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(resolveInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeName) => {
    setThemeState(nextTheme);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const currentIndex = THEME_OPTIONS.findIndex((option) => option.id === currentTheme);
      const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
      return THEME_OPTIONS[nextIndex].id;
    });
  }, []);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      options: THEME_OPTIONS,
      setTheme,
      cycleTheme,
    }),
    [cycleTheme, setTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
