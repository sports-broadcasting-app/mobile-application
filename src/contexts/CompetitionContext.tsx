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
import { CompetitionSlug } from '../types/snapshot';
import { ALL_COMPETITIONS } from '../constants/competitions';

export type CompetitionFilter = 'todos' | CompetitionSlug;

export const FOLLOWED_KEY = '@followed_competitions';

interface CompetitionContextValue {
  /** The competitions the user follows, in display order. Never empty. */
  followed: CompetitionSlug[];
  isFollowed: (competition: CompetitionSlug) => boolean;
  /** Ignores an empty list: at least one competition stays followed. */
  setFollowed: (competitions: CompetitionSlug[]) => void;
  /** The Home filter, "todos" or one followed competition. */
  filter: CompetitionFilter;
  setFilter: (filter: CompetitionFilter) => void;
  /** The competition the Standings show: the last one picked anywhere. */
  competition: CompetitionSlug;
  /** Picking in the Standings filters the Home by the same competition. */
  setCompetition: (competition: CompetitionSlug) => void;
}

const CompetitionContext = createContext<CompetitionContextValue>({
  followed: ALL_COMPETITIONS,
  isFollowed: () => true,
  setFollowed: () => {},
  filter: 'todos',
  setFilter: () => {},
  competition: ALL_COMPETITIONS[0],
  setCompetition: () => {},
});

/** Keeps the app's order and drops slugs this version does not know. */
function normalize(list: unknown[]): CompetitionSlug[] {
  return ALL_COMPETITIONS.filter((slug) => list.includes(slug));
}

/**
 * The followed competitions and the chosen one, shared by the tabs.
 * Filtering the Home by a competition opens the Standings on it and the
 * other way round; only "Todos" in the Home leaves the Standings as they
 * were. Nothing stored (installs from before this choice) means everything.
 */
export function CompetitionProvider({ children }: { children: ReactNode }) {
  const [followed, setFollowedState] =
    useState<CompetitionSlug[]>(ALL_COMPETITIONS);
  const [filter, setFilterState] = useState<CompetitionFilter>('todos');
  const [competition, setCompetitionState] = useState<CompetitionSlug>(
    ALL_COMPETITIONS[0],
  );

  useEffect(() => {
    AsyncStorage.getItem(FOLLOWED_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed = JSON.parse(stored) as unknown;
        const list = Array.isArray(parsed) ? normalize(parsed) : [];
        if (list.length > 0) setFollowedState(list);
      })
      .catch(() => {});
  }, []);

  // A competition the user stopped following leaves the filters with it.
  useEffect(() => {
    if (filter !== 'todos' && !followed.includes(filter)) {
      setFilterState('todos');
    }
    if (!followed.includes(competition)) setCompetitionState(followed[0]);
  }, [followed, filter, competition]);

  const setFollowed = useCallback((next: CompetitionSlug[]) => {
    const list = normalize(next);
    if (list.length === 0) return;
    setFollowedState(list);
    AsyncStorage.setItem(FOLLOWED_KEY, JSON.stringify(list)).catch(() => {});
  }, []);

  const isFollowed = useCallback(
    (slug: CompetitionSlug) => followed.includes(slug),
    [followed],
  );

  const setFilter = useCallback((next: CompetitionFilter) => {
    setFilterState(next);
    if (next !== 'todos') setCompetitionState(next);
  }, []);

  const setCompetition = useCallback((next: CompetitionSlug) => {
    setCompetitionState(next);
    setFilterState(next);
  }, []);

  const value = useMemo(
    () => ({
      followed,
      isFollowed,
      setFollowed,
      filter,
      setFilter,
      competition,
      setCompetition,
    }),
    [
      followed,
      isFollowed,
      setFollowed,
      filter,
      setFilter,
      competition,
      setCompetition,
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
