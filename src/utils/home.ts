import type { CompetitionFilter } from '../contexts/CompetitionContext';
import type {
  CompetitionSlug,
  Match,
  RaceSession,
  Sport,
} from '../types/snapshot';
import {
  getCompetition,
  getSport,
  isCompetitionSlug,
} from '../constants/competitions';
import { formatWeekend } from './sessions';

/** The rules of the Jogos screen, apart from what draws them. */

/** Below this many games a day looks empty: the next ones fill it. */
export const FEW_MATCHES = 3;

export interface HomeSection {
  key: string;
  title: string;
  favorite?: boolean;
  matches: Match[];
  sessions: RaceSession[];
}

export interface ChipOption {
  value: CompetitionFilter;
  label: string;
  sport?: Sport;
}

export type NextItem =
  { match: Match; session: null } | { match: null; session: RaceSession };

const sportOf = (slug: CompetitionSlug) => getCompetition(slug).sport;

function plural(count: number, one: string, many: string): string {
  return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

/** The competitions a filter shows. */
export function scopeOf(
  filter: CompetitionFilter,
  followed: CompetitionSlug[],
  followedIn: (sport: Sport) => CompetitionSlug[],
): CompetitionSlug[] {
  if (filter === 'todos') return followed;
  return isCompetitionSlug(filter) ? [filter] : followedIn(filter);
}

/**
 * The day's list. One competition: a single unnamed section (the title
 * names it). Otherwise one section per competition, and in "Todos" your
 * teams' games first, in a section of their own.
 */
export function buildSections({
  filter,
  scope,
  matches,
  sessions,
  isFavoriteMatch,
}: {
  filter: CompetitionFilter;
  scope: CompetitionSlug[];
  matches: Match[];
  sessions: RaceSession[];
  isFavoriteMatch: (match: Match) => boolean;
}): HomeSection[] {
  if (isCompetitionSlug(filter)) {
    return [{ key: 'all', title: '', matches, sessions }];
  }
  const mine = filter === 'todos' ? matches.filter(isFavoriteMatch) : [];
  const groups: HomeSection[] = scope
    .map((slug) => ({
      key: slug,
      title: getCompetition(slug).name,
      matches: matches.filter(
        (match) => match.competition === slug && !mine.includes(match),
      ),
      sessions: sessions.filter((session) => session.competition === slug),
    }))
    .filter((section) => section.matches.length + section.sessions.length > 0);
  return mine.length > 0
    ? [
        {
          key: 'mine',
          title: 'Seus times',
          favorite: true,
          matches: mine,
          sessions: [],
        },
        ...groups,
      ]
    : groups;
}

/** "· 3 jogos" after a section title; none for "Seus times". */
export function sectionDetail(section: HomeSection): string | undefined {
  if (section.favorite) return undefined;
  return section.sessions.length > 0
    ? plural(section.sessions.length, 'sessão', 'sessões')
    : plural(section.matches.length, 'jogo', 'jogos');
}

/** Coming games and sessions in one list, soonest first. */
export function mergeNext(
  matches: Match[],
  sessions: RaceSession[],
  limit = 6,
): NextItem[] {
  const items: NextItem[] = [
    ...matches.map((match) => ({ match, session: null })),
    ...sessions.map((session) => ({ match: null, session })),
  ];
  const start = (item: NextItem) =>
    Date.parse((item.match ?? item.session).startsAt);
  return items.sort((a, b) => start(a) - start(b)).slice(0, limit);
}

/**
 * The chip row. One chip per sport; a sport with a single followed
 * competition shows that competition (Brasileirão, F1). A sport with 2+
 * picked swaps the row for its competitions (`split`), behind a back chip:
 * picking the sport already shows all of it, so there is no "Todas".
 */
export function chipRow(
  filter: CompetitionFilter,
  followedSports: Sport[],
  followedIn: (sport: Sport) => CompetitionSlug[],
): {
  options: ChipOption[];
  split: boolean;
  sport: Sport | null;
  /** The filter a tap on `value` sets. */
  pick: (value: CompetitionFilter) => CompetitionFilter;
} {
  const sport: Sport | null =
    filter === 'todos'
      ? null
      : isCompetitionSlug(filter)
        ? sportOf(filter)
        : filter;
  const own = sport ? followedIn(sport) : [];
  const split = sport !== null && own.length > 1;
  const options: ChipOption[] = split
    ? own.map((slug) => ({ value: slug, label: getCompetition(slug).label }))
    : [
        { value: 'todos', label: 'Todos' },
        ...followedSports.map((each) => {
          const inSport = followedIn(each);
          return inSport.length === 1
            ? {
                value: inSport[0],
                label: getCompetition(inSport[0]).label,
                sport: each,
              }
            : { value: each, label: getSport(each).name, sport: each };
        }),
      ];
  return {
    options,
    split,
    sport,
    // The picked competition again goes back to the whole sport.
    pick: (value) =>
      split && value === filter && sport !== null ? sport : value,
  };
}

/** "Jogos", the sport, or the competition. */
export function homeTitle(filter: CompetitionFilter): string {
  if (filter === 'todos') return 'Jogos';
  return isCompetitionSlug(filter)
    ? getCompetition(filter).name
    : getSport(filter).name;
}

/** Only Formula 1 in view: sessions, not games. */
export const onlySessions = (scope: CompetitionSlug[]) =>
  scope.every((slug) => sportOf(slug) === 'automobilismo');

export function nextTitle(
  filter: CompetitionFilter,
  scope: CompetitionSlug[],
): string {
  if (onlySessions(scope)) return 'Próximas sessões';
  return isCompetitionSlug(filter)
    ? `Próximos jogos · ${getCompetition(filter).label}`
    : 'Próximos jogos';
}

/** The next weekend of a series, for the news card. */
export function describeNext(sessions: RaceSession[]): string | undefined {
  const [first] = sessions;
  if (!first) return undefined;
  const weekend = sessions.filter((s) => s.grandPrixId === first.grandPrixId);
  const when = formatWeekend(weekend);
  return `O próximo é o ${first.grandPrix}, ${when.includes(' a ') ? 'de' : 'em'} ${when}.`;
}
