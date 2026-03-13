import { useQuery } from '@tanstack/react-query';
import { fetchStandings } from '../services/matchService';
import { Sport, StandingsTable } from '../types/match';

export function useStandings(championship?: string, sport?: Sport) {
  const { data, isLoading, error, refetch } = useQuery<StandingsTable[]>({
    queryKey: ['standings', championship, sport],
    queryFn: () => fetchStandings(championship, sport),
    staleTime: 30 * 60 * 1000,
  });

  return {
    tables: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
