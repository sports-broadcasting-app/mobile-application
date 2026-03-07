import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Match, Sport } from '../types/match';
import { fetchTodayMatches } from '../services/matchService';
import { useFavoriteTeam } from '../contexts/FavoriteTeamContext';

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
  const { favoriteTeam } = useFavoriteTeam();
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
    const favSlug = favoriteTeam?.team.slug;

    const isFavoriteMatch = (m: Match): boolean => {
      if (!favSlug || m.sport === 'formula1') return false;
      return m.homeTeam.slug === favSlug || m.awayTeam.slug === favSlug;
    };

    return [...schedule.matches].sort((a, b) => {
      if (a.status === 'match-live' && b.status !== 'match-live') return -1;
      if (a.status !== 'match-live' && b.status === 'match-live') return 1;
      const aFav = isFavoriteMatch(a);
      const bFav = isFavoriteMatch(b);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.hour.localeCompare(b.hour);
    });
  }, [schedule?.matches, favoriteTeam]);

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
