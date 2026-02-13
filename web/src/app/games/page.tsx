import Link from "next/link";
import { GAME_CATALOG, gameHref } from "@/config/gameCatalog";

export default function GamesDirectoryPage() {
  return (
    <div className="flex flex-col gap-5">
      <header className="glass-panel rounded-3xl p-6">
        <span className="chip">Library</span>
        <h1 className="brand-title mt-3 text-3xl text-[var(--text-primary)]">Games Directory</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          Pick any title to launch instantly. Every game has updated controls, improved animation, and fixed logic paths.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
        {GAME_CATALOG.map((game) => (
          <article key={game.slug} className="glass-tile rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{game.name}</h2>
              <span className="chip">{game.tag}</span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{game.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Difficulty {game.difficulty}
              </span>
              <Link
                href={gameHref(game.slug)}
                className="focus-ring rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
              >
                Launch
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
