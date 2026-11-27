import { useCallback, useMemo } from 'react';
import { STRIP_FIRST_OFFSET, STRIP_LAST_OFFSET } from '../components/DayStrip';
import type { CompetitionFilter } from '../contexts/CompetitionContext';
import { useFavorites } from '../contexts/FavoritesContext';
import {
  sortForDisplay,
  useDayMatches,
  useDaySessions,
  useEventDays,
  useNextMatches,
  useNextSessions,
} from './useSuperliga';
import type { CompetitionSlug, Match } from '../types/snapshot';
import { addDays, getDayBounds } from '../utils/date';
import { buildSections, FEW_MATCHES, mergeNext } from '../utils/home';

/**
 * Everything the Jogos screen shows for one day: its games and sessions in
 * sections, whether to fill it with the next ones, and the strip's dots.
 */
export function useHomeDay(
  today: Date,
  offset: number,
  filter: CompetitionFilter,
  scope: CompetitionSlug[],
) {
  const { favorites } = useFavorites();
  const day = addDays(today, offset);
  const { data: dayMatches } = useDayMatches(day);
  const { data: daySessions } = useDaySessions(day);
  const eventDays = useEventDays(
    getDayBounds(addDays(today, STRIP_FIRST_OFFSET)).start,
    getDayBounds(addDays(today, STRIP_LAST_OFFSET)).end,
    scope,
  );

  // A favorite counts in its own competition only.
  const isFavoriteMatch = useCallback(
    (match: Match) => {
      const teamId = favorites[match.competition];
      return teamId === match.homeTeamId || teamId === match.awayTeamId;
    },
    [favorites],
  );
  const isFavoriteTeam = useCallback(
    (teamId: string) => Object.values(favorites).includes(teamId),
    [favorites],
  );

  const matches = useMemo(
    () =>
      sortForDisplay(
        (dayMatches ?? []).filter((match) => scope.includes(match.competition)),
        isFavoriteTeam,
      ),
    [dayMatches, scope, isFavoriteTeam],
  );
  const sessions = useMemo(
    () =>
      (daySessions ?? []).filter((session) =>
        scope.includes(session.competition),
      ),
    [daySessions, scope],
  );
  const sections = useMemo(
    () => buildSections({ filter, scope, matches, sessions, isFavoriteMatch }),
    [filter, scope, matches, sessions, isFavoriteMatch],
  );

  const total = matches.length + sessions.length;
  const loaded = dayMatches !== undefined && daySessions !== undefined;
  const showNext = loaded && total < FEW_MATCHES;
  const nextFrom = getDayBounds(day).end;
  const { data: nextMatches } = useNextMatches(nextFrom, scope, showNext);
  const { data: nextSessions } = useNextSessions(nextFrom, scope, showNext);
  const next = useMemo(
    () => (showNext ? mergeNext(nextMatches ?? [], nextSessions ?? []) : []),
    [showNext, nextMatches, nextSessions],
  );

  return {
    day,
    sections,
    isEmpty: loaded && total === 0,
    next,
    eventDays,
    isFavoriteMatch,
  };
}
