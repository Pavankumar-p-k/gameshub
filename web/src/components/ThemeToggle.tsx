"use client";

import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, options, setTheme, cycleTheme } = useTheme();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={cycleTheme}
        type="button"
        className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] transition hover:-translate-y-0.5 hover:text-[var(--text-primary)]"
      >
        Cycle Theme
      </button>
      <div className="flex items-center gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setTheme(option.id)}
            type="button"
            aria-pressed={theme === option.id}
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition ${
              theme === option.id
                ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_8px_20px_var(--shadow-color)]"
                : "border-[var(--border-soft)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
