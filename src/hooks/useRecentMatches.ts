import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Match, Sport } from '../types/match';

const STORAGE_KEY = '@ondever/recent-matches';
const MAX_RECENTS = 20;

interface RecentEntry {
  id: string;
  sport: Sport;
  viewedAt: string;
}

interface UseRecentMatchesResult {
  recentIds: RecentEntry[];
  addRecent: (match: Match) => void;
  clearRecents: () => void;
}

export function useRecentMatches(): UseRecentMatchesResult {
  const [recentIds, setRecentIds] = useState<RecentEntry[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setRecentIds(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const addRecent = useCallback((match: Match) => {
    setRecentIds((prev) => {
      const filtered = prev.filter((r) => r.id !== match.id);
      const entry: RecentEntry = {
        id: match.id,
        sport: match.sport,
        viewedAt: new Date().toISOString(),
      };
      const updated = [entry, ...filtered].slice(0, MAX_RECENTS);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(
        () => {},
      );
      return updated;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecentIds([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  return { recentIds, addRecent, clearRecents };
}
