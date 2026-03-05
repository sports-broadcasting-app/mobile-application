import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Match, Sport } from '../types/match';
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
  const {
    data: schedule,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['todayMatches', sport],
    queryFn: () => fetchTodayMatches(sport),
  });

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
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
    championships,
    highlightedMatches,
  };
}
