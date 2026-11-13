// The pet's name: typed on the entry screen (index.html's #start) before the game starts, kept across visits and
// read live by the name over the dog's head and the multiplayer hello (src/net.ts). Falls back to "Buddy" until it
// is typed; an empty field keeps the last non-empty one out — the placeholder shows the fallback.

const KEY = 'nanite-petname';
export const DEFAULT_PET_NAME = 'Buddy';

export interface PetName {
  /** The current name (never empty). */
  get(): string;
  /** Fires on every edit of the field. */
  onChange(cb: (name: string) => void): void;
}

export function createPetName(): PetName {
  const input = document.getElementById('petname') as HTMLInputElement | null;
  const listeners = new Set<(name: string) => void>();
  let stored = '';
  try { stored = localStorage.getItem(KEY) ?? ''; } catch { /* private mode */ }
  let name = stored.trim() || DEFAULT_PET_NAME;
  if (input) {
    input.value = stored;
    input.addEventListener('input', () => {
      name = input.value.trim() || DEFAULT_PET_NAME;
      try { localStorage.setItem(KEY, input.value); } catch { /* private mode */ }
      for (const cb of listeners) cb(name);
    });
    // Enter leaves the field (the click anywhere else captures the mouse and starts the run)
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
  }
  return {
    get: () => name,
    onChange: (cb) => { listeners.add(cb); },
  };
}
