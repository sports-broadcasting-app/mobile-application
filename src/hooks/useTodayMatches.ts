import { useEffect, useState, useCallback, useMemo } from 'react';
import { DailySchedule, Match, Sport } from '../types/match';
import { fetchTodayMatches } from '../services/matchService';

interface UseTodayMatchesResult {
  matches: Match[];
  date: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  championships: string[];
  highlightedMatches: Match[];
}

export function useTodayMatches(sport?: Sport): UseTodayMatchesResult {
  const [schedule, setSchedule] = useState<DailySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTodayMatches(sport);
      setSchedule(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    load();
  }, [load]);

  const championships = useMemo(() => {
    if (!schedule?.matches) return [];
    const slugs = new Set(schedule.matches.map((m) => m.championship.slug));
    return Array.from(slugs).sort();
  }, [schedule?.matches]);

  const highlightedMatches = useMemo(() => {
    if (!schedule?.matches) return [];
    return [...schedule.matches].sort((a, b) => {
      if (a.status === 'match-live' && b.status !== 'match-live') return -1;
      if (a.status !== 'match-live' && b.status === 'match-live') return 1;
      return a.hour.localeCompare(b.hour);
    });
  }, [schedule?.matches]);

  return {
    matches: schedule?.matches ?? [],
    date: schedule?.date ?? null,
    loading,
    error,
    refetch: load,
    championships,
    highlightedMatches,
  };
}
