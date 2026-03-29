import { useState, useCallback } from 'react';

const STORAGE_KEY = 'x402_favorites';

function readIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorage unavailable (e.g., private browsing with restrictions)
  }
}

export interface UseFavoritesResult {
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
}

export function useFavorites(): UseFavoritesResult {
  const [favorites, setFavorites] = useState<Set<string>>(readIds);

  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      writeIds(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  const clear = useCallback(() => {
    const empty = new Set<string>();
    writeIds(empty);
    setFavorites(empty);
  }, []);

  return { favorites, isFavorite, toggle, clear };
}
