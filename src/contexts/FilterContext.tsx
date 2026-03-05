import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { Sport } from '../types/match';

interface FilterState {
  sports: Sport[];
  championships: string[];
  broadcasters: string[];
}

interface FilterContextValue {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const EMPTY_FILTERS: FilterState = {
  sports: [],
  championships: [],
  broadcasters: [],
};

const FilterContext = createContext<FilterContextValue>({
  filters: EMPTY_FILTERS,
  setFilters: () => {},
  clearFilters: () => {},
  hasActiveFilters: false,
});

interface FilterProviderProps {
  children: ReactNode;
}

export function FilterProvider({ children }: FilterProviderProps) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      clearFilters: () => setFilters(EMPTY_FILTERS),
      hasActiveFilters:
        filters.sports.length > 0 ||
        filters.championships.length > 0 ||
        filters.broadcasters.length > 0,
    }),
    [filters],
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  return useContext(FilterContext);
}
