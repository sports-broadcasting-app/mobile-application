import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { CompetitionSlug } from '../types/snapshot';

export type CompetitionFilter = 'todos' | CompetitionSlug;

interface CompetitionContextValue {
  /** The Home filter, "todos" or one competition. */
  filter: CompetitionFilter;
  setFilter: (filter: CompetitionFilter) => void;
  /** The competition the Standings show: the last one picked anywhere. */
  competition: CompetitionSlug;
  /** Picking in the Standings filters the Home by the same competition. */
  setCompetition: (competition: CompetitionSlug) => void;
}

const CompetitionContext = createContext<CompetitionContextValue>({
  filter: 'todos',
  setFilter: () => {},
  competition: 'masculina',
  setCompetition: () => {},
});

/**
 * Keeps the chosen competition across tabs, both ways: filtering the Home
 * by the Brasileirão opens the Standings on it, and picking the Brasileirão
 * in the Standings filters the Home. Only "Todos" in the Home leaves the
 * Standings where they were.
 */
export function CompetitionProvider({ children }: { children: ReactNode }) {
  const [filter, setFilterState] = useState<CompetitionFilter>('todos');
  const [competition, setCompetitionState] =
    useState<CompetitionSlug>('masculina');

  const setFilter = useCallback((next: CompetitionFilter) => {
    setFilterState(next);
    if (next !== 'todos') setCompetitionState(next);
  }, []);

  const setCompetition = useCallback((next: CompetitionSlug) => {
    setCompetitionState(next);
    setFilterState(next);
  }, []);

  const value = useMemo(
    () => ({ filter, setFilter, competition, setCompetition }),
    [filter, setFilter, competition, setCompetition],
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
