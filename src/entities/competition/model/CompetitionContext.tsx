import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompetitionSlug, Sport } from '@/shared/api/snapshot';
import { parseJson } from '@/shared/lib/json';
import {
  ALL_COMPETITIONS,
  getCompetition,
  isCompetitionSlug,
  DEFAULT_COMPETITION,
} from '@/shared/config/competitions';

/** The Home filter: everything, one sport, or one competition. */
export type CompetitionFilter = 'todos' | Sport | CompetitionSlug;

export const FOLLOWED_KEY = '@followed_competitions';
/** Competitions the user has already been offered (onboarding or a card). */
export const KNOWN_KEY = '@known_competitions';
/** What every install knew before the list was stored (up to 1.4). */
const KNOWN_BEFORE_1_5: CompetitionSlug[] = [
  'masculina',
  'feminina',
  'serie-a',
  'nfl',
  'nba',
];

interface CompetitionContextValue {
  /** The competitions the user follows, in display order. Never empty. */
  followed: CompetitionSlug[];
  isFollowed: (competition: CompetitionSlug) => boolean;
  /** Ignores an empty list: at least one competition stays followed. */
  setFollowed: (competitions: CompetitionSlug[]) => void;
  /** Sports with at least one followed competition, in display order. */
  followedSports: Sport[];
  /** The followed competitions of one sport. */
  followedIn: (sport: Sport) => CompetitionSlug[];
  /** The Home filter. */
  filter: CompetitionFilter;
  setFilter: (filter: CompetitionFilter) => void;
  /** The competition the Standings show: the last one picked anywhere. */
  competition: CompetitionSlug;
  /** Picking in the Standings filters the Home by the same competition. */
  setCompetition: (competition: CompetitionSlug) => void;
  /**
   * Competitions new to this install, of a sport the user does not follow:
   * the Home offers each once. A new competition of a followed sport is
   * followed straight away instead.
   */
  news: CompetitionSlug[];
  /** Follows it (true) or not, and never offers it again. */
  answerNews: (competition: CompetitionSlug, follow: boolean) => void;
  /** Everything in this version was offered (the onboarding did it). */
  markAllKnown: () => void;
}

const CompetitionContext = createContext<CompetitionContextValue>({
  followed: ALL_COMPETITIONS,
  isFollowed: () => true,
  setFollowed: () => {},
  followedSports: [],
  followedIn: () => [],
  filter: 'todos',
  setFilter: () => {},
  competition: DEFAULT_COMPETITION,
  setCompetition: () => {},
  news: [],
  answerNews: () => {},
  markAllKnown: () => {},
});

/** Keeps the app's order and drops slugs this version does not know. */
function normalize(list: unknown[]): CompetitionSlug[] {
  return ALL_COMPETITIONS.filter((slug) => list.includes(slug));
}

const sportOf = (slug: CompetitionSlug) => getCompetition(slug).sport;

function store(key: string, list: CompetitionSlug[]): void {
  AsyncStorage.setItem(key, JSON.stringify(list)).catch(() => {});
}

function parseList(stored: string | null): CompetitionSlug[] | null {
  if (!stored) return null;
  try {
    const parsed = parseJson(stored);
    return Array.isArray(parsed) ? normalize(parsed) : null;
  } catch {
    return null;
  }
}

/**
 * What a stored state becomes in this version: competitions the install has
 * never seen join the followed list when their sport is followed, and are
 * offered (news) when it is not.
 */
export function resolveNewCompetitions(
  followed: CompetitionSlug[],
  known: CompetitionSlug[],
): {
  followed: CompetitionSlug[];
  known: CompetitionSlug[];
  news: CompetitionSlug[];
} {
  const sports = new Set(followed.map(sportOf));
  const unseen = ALL_COMPETITIONS.filter((slug) => !known.includes(slug));
  const joined = unseen.filter((slug) => sports.has(sportOf(slug)));
  return {
    followed: normalize([...followed, ...joined]),
    known: normalize([...known, ...joined]),
    news: unseen.filter((slug) => !joined.includes(slug)),
  };
}

/**
 * The followed competitions and the chosen filter, shared by the tabs.
 * Filtering the Home by a competition opens the Standings on it and the
 * other way round. Nothing stored (installs from before this choice) means
 * everything.
 */
export function CompetitionProvider({ children }: { children: ReactNode }) {
  const [followed, setFollowedState] =
    useState<CompetitionSlug[]>(ALL_COMPETITIONS);
  const [known, setKnown] = useState<CompetitionSlug[]>(ALL_COMPETITIONS);
  const [filter, setFilterState] = useState<CompetitionFilter>('todos');
  const [competition, setCompetitionState] =
    useState<CompetitionSlug>(DEFAULT_COMPETITION);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(FOLLOWED_KEY),
      AsyncStorage.getItem(KNOWN_KEY),
    ])
      .then(([storedFollowed, storedKnown]) => {
        const list = parseList(storedFollowed);
        // Following everything (nothing stored) already covers new ones.
        if (!list || list.length === 0) return;
        const resolved = resolveNewCompetitions(
          list,
          parseList(storedKnown) ?? KNOWN_BEFORE_1_5,
        );
        setFollowedState(resolved.followed);
        setKnown(resolved.known);
        if (resolved.followed.length !== list.length) {
          store(FOLLOWED_KEY, resolved.followed);
        }
        store(KNOWN_KEY, resolved.known);
      })
      .catch(() => {});
  }, []);

  const followedIn = useCallback(
    (sport: Sport) => followed.filter((slug) => sportOf(slug) === sport),
    [followed],
  );

  // A filter the user can no longer pick falls back. A sport down to one
  // competition becomes that competition, as its chip does.
  useEffect(() => {
    if (filter !== 'todos') {
      if (isCompetitionSlug(filter)) {
        if (!followed.includes(filter)) setFilterState('todos');
      } else {
        const [only, ...others] = followedIn(filter);
        if (!only) setFilterState('todos');
        else if (others.length === 0) setFilterState(only);
      }
    }
    if (!followed.includes(competition)) {
      setCompetitionState(followed[0] ?? DEFAULT_COMPETITION);
    }
  }, [followed, filter, competition, followedIn]);

  const setFollowed = useCallback((next: CompetitionSlug[]) => {
    const list = normalize(next);
    if (list.length === 0) return;
    setFollowedState(list);
    store(FOLLOWED_KEY, list);
  }, []);

  const isFollowed = useCallback(
    (slug: CompetitionSlug) => followed.includes(slug),
    [followed],
  );

  const setFilter = useCallback(
    (next: CompetitionFilter) => {
      setFilterState(next);
      if (next === 'todos') return;
      if (isCompetitionSlug(next)) setCompetitionState(next);
      else {
        const first = followed.find((slug) => sportOf(slug) === next);
        if (first) setCompetitionState(first);
      }
    },
    [followed],
  );

  const setCompetition = useCallback((next: CompetitionSlug) => {
    setCompetitionState(next);
    setFilterState(next);
  }, []);

  const news = useMemo(
    () =>
      ALL_COMPETITIONS.filter(
        (slug) => !known.includes(slug) && !followed.includes(slug),
      ),
    [known, followed],
  );

  const answerNews = useCallback(
    (slug: CompetitionSlug, follow: boolean) => {
      const nextKnown = normalize([...known, slug]);
      setKnown(nextKnown);
      store(KNOWN_KEY, nextKnown);
      if (follow) setFollowed([...followed, slug]);
    },
    [known, followed, setFollowed],
  );

  const markAllKnown = useCallback(() => {
    setKnown(ALL_COMPETITIONS);
    store(KNOWN_KEY, ALL_COMPETITIONS);
  }, []);

  const followedSports = useMemo(
    () => [...new Set(followed.map(sportOf))],
    [followed],
  );

  const value = useMemo(
    () => ({
      followed,
      isFollowed,
      setFollowed,
      followedSports,
      followedIn,
      filter,
      setFilter,
      competition,
      setCompetition,
      news,
      answerNews,
      markAllKnown,
    }),
    [
      followed,
      isFollowed,
      setFollowed,
      followedSports,
      followedIn,
      filter,
      setFilter,
      competition,
      setCompetition,
      news,
      answerNews,
      markAllKnown,
    ],
  );

  return (
    <CompetitionContext.Provider value={value}>
      {children}
    </CompetitionContext.Provider>
  );
}

export function useCompetition(): CompetitionContextValue {
  return useContext(CompetitionContext);
}
