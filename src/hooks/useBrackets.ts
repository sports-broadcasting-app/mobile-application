import { useQuery } from '@tanstack/react-query';
import { fetchBrackets } from '../services/matchService';
import { Bracket, Sport } from '../types/match';

export function useBrackets(championship?: string, sport?: Sport) {
  const { data, isLoading, error, refetch } = useQuery<Bracket[]>({
    queryKey: ['brackets', championship, sport],
    queryFn: () => fetchBrackets(championship, sport),
    staleTime: 30 * 60 * 1000,
  });

  return {
    brackets: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
