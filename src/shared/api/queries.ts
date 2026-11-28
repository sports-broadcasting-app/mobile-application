import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSync } from './sync/SyncContext';
import {
  countTransfers,
  getEventStarts,
  getGrandPrix,
  getMatch,
  getMatchesBetween,
  getNextMatches,
  getNextSessions,
  getSessionsBetween,
  getStandings,
  getTeams,
  getTransfers,
} from './database';
import { CompetitionSlug, Match, Team } from './snapshot';
import { getDayBounds } from '@/shared/lib/date';

const NEXT_MATCHES_LIMIT = 6;
const STATUS_ORDER: Record<Match['status'], number> = {
  live: 0,
  scheduled: 1,
  postponed: 1,
  finished: 2,
};

export function useTeamsById(): Map<string, Team> {
  const { dataVersion } = useSync();
  const { data } = useQuery({
    queryKey: ['teams', dataVersion],
    queryFn: () => getTeams(),
  });
  return useMemo(
    () => new Map((data ?? []).map((team) => [team.id, team])),
    [data],
  );
}

export function useTeams(competition: CompetitionSlug) {
  const { dataVersion } = useSync();
  return useQuery({
    queryKey: ['teams', competition, dataVersion],
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
  const { dataVersion } = useSync();
  const { start, end } = getDayBounds(day);
  return useQuery({
    queryKey: ['matches', start, dataVersion],
    queryFn: () => getMatchesBetween(start, end),
  });
}

export function useNextMatches(
  fromMs: number,
  competitions: CompetitionSlug[],
  enabled: boolean,
) {
  const { dataVersion } = useSync();
  return useQuery({
    queryKey: ['nextMatches', fromMs, competitions.join(','), dataVersion],
    queryFn: () => getNextMatches(fromMs, NEXT_MATCHES_LIMIT, competitions),
    enabled,
  });
}

export function useMatch(id: string) {
  const { dataVersion } = useSync();
  return useQuery({
    queryKey: ['match', id, dataVersion],
    queryFn: () => getMatch(id),
  });
}

export function useTransfers(competition: CompetitionSlug) {
  const { dataVersion } = useSync();
  return useQuery({
    queryKey: ['transfers', competition, dataVersion],
    queryFn: () => getTransfers(competition),
  });
}

export function useHasTransfers(competition: CompetitionSlug): boolean {
  const { dataVersion } = useSync();
  const { data } = useQuery({
    queryKey: ['transferCount', competition, dataVersion],
    queryFn: () => countTransfers(competition),
  });
  return (data ?? 0) > 0;
}

export function useStandings(competition: CompetitionSlug) {
  const { dataVersion } = useSync();
  return useQuery({
    queryKey: ['standings', competition, dataVersion],
    queryFn: () => getStandings(competition),
  });
}

export function useDaySessions(day: Date) {
  const { dataVersion } = useSync();
  const { start, end } = getDayBounds(day);
  return useQuery({
    queryKey: ['sessions', start, dataVersion],
    queryFn: () => getSessionsBetween(start, end),
  });
}

export function useNextSessions(
  fromMs: number,
  competitions: CompetitionSlug[],
  enabled: boolean,
  limit = NEXT_MATCHES_LIMIT,
) {
  const { dataVersion } = useSync();
  return useQuery({
    queryKey: [
      'nextSessions',
      fromMs,
      competitions.join(','),
      limit,
      dataVersion,
    ],
    queryFn: () => getNextSessions(fromMs, limit, competitions),
    enabled,
  });
}

export function useGrandPrix(grandPrixId: string) {
  const { dataVersion } = useSync();
  return useQuery({
    queryKey: ['grandPrix', grandPrixId, dataVersion],
    queryFn: () => getGrandPrix(grandPrixId),
  });
}

/** Local day starts (ms) between the two instants with a game or session. */
export function useEventDays(
  fromMs: number,
  toMs: number,
  competitions: CompetitionSlug[],
): Set<number> {
  const { dataVersion } = useSync();
  const { data } = useQuery({
    queryKey: ['eventDays', fromMs, toMs, competitions.join(','), dataVersion],
    queryFn: () => getEventStarts(fromMs, toMs, competitions),
  });
  return useMemo(
    () => new Set((data ?? []).map((ms) => getDayBounds(new Date(ms)).start)),
    [data],
  );
}
