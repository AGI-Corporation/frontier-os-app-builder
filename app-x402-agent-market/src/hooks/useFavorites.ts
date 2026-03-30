import { useCallback, useEffect, useState } from 'react';

const FAVORITES_KEY = 'x402_favorites';

const loadFavorites = (): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
};

const saveFavorites = (ids: string[]): void => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors (e.g. private browsing quota exceeded)
  }
};

export interface UseFavoritesResult {
  favorites: string[];
  isFavorite: (agentId: string) => boolean;
  toggleFavorite: (agentId: string) => void;
  addFavorite: (agentId: string) => void;
  removeFavorite: (agentId: string) => void;
}

export const useFavorites = (): UseFavoritesResult => {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const isFavorite = useCallback((agentId: string) => favorites.includes(agentId), [favorites]);

  const addFavorite = useCallback((agentId: string) => {
    setFavorites((prev) => (prev.includes(agentId) ? prev : [...prev, agentId]));
  }, []);

  const removeFavorite = useCallback((agentId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== agentId));
  }, []);

  const toggleFavorite = useCallback((agentId: string) => {
    setFavorites((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId],
    );
  }, []);

  return { favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite };
};
