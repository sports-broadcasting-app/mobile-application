import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSync } from '../contexts/SyncContext';
import {
  getMatch,
  getMatchesBetween,
  getNextMatches,
  getStandings,
  getTeams,
} from '../data/database';
import { CompetitionSlug, Match, Team } from '../types/superliga';
import { getDayBounds } from '../utils/date';

const NEXT_MATCHES_LIMIT = 6;
const STATUS_ORDER: Record<Match['status'], number> = {
  live: 0,
  scheduled: 1,
  postponed: 1,
  finished: 2,
};

export function useTeamsById(): Map<string, Team> {
  const { lastSyncAt } = useSync();
  const { data } = useQuery({
    queryKey: ['teams', lastSyncAt],
    queryFn: () => getTeams(),
  });
  return useMemo(
    () => new Map((data ?? []).map((team) => [team.id, team])),
    [data],
  );
}

export function useTeams(competition: CompetitionSlug) {
  const { lastSyncAt } = useSync();
  return useQuery({
    queryKey: ['teams', competition, lastSyncAt],
    queryFn: () => getTeams(competition),
  });
}

export function sortForDisplay(
  matches: Match[],
  isFavorite: (teamId: string) => boolean,
): Match[] {
  const favoriteRank = (match: Match) =>
    isFavorite(match.homeTeamId) || isFavorite(match.awayTeamId) ? 0 : 1;

  return [...matches].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      favoriteRank(a) - favoriteRank(b) ||
      Date.parse(a.startsAt) - Date.parse(b.startsAt),
  );
}

export function useDayMatches(day: Date) {
  const { lastSyncAt } = useSync();
  const { start, end } = getDayBounds(day);
  return useQuery({
    queryKey: ['matches', start, lastSyncAt],
    queryFn: () => getMatchesBetween(start, end),
  });
}

export function useNextMatches(
  fromMs: number,
  competition: CompetitionSlug | undefined,
  enabled: boolean,
) {
  const { lastSyncAt } = useSync();
  return useQuery({
    queryKey: ['nextMatches', fromMs, competition, lastSyncAt],
    queryFn: () => getNextMatches(fromMs, NEXT_MATCHES_LIMIT, competition),
    enabled,
  });
}

export function useMatch(id: string) {
  const { lastSyncAt } = useSync();
  return useQuery({
    queryKey: ['match', id, lastSyncAt],
    queryFn: () => getMatch(id),
  });
}

export function useStandings(competition: CompetitionSlug) {
  const { lastSyncAt } = useSync();
  return useQuery({
    queryKey: ['standings', competition, lastSyncAt],
    queryFn: () => getStandings(competition),
  });
}
