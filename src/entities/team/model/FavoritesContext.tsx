import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  deleteFavorite,
  Favorites,
  getFavorites,
  saveFavorite,
} from '@/shared/api/database';
import { CompetitionSlug } from '@/shared/api/snapshot';

interface FavoritesContextValue {
  favorites: Favorites;
  toggleFavorite: (
    competition: CompetitionSlug,
    teamId: string,
  ) => Promise<void>;
  /** Makes `teamId` the favorite of the competition; null removes it. */
  setFavorite: (
    competition: CompetitionSlug,
    teamId: string | null,
  ) => Promise<void>;
  isFavorite: (teamId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: {},
  toggleFavorite: async () => {},
  setFavorite: async () => {},
  isFavorite: () => false,
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorites>({});

  useEffect(() => {
    getFavorites()
      .then(setFavorites)
      .catch((error: unknown) => {
        console.warn('Failed to load favorites:', error);
      });
  }, []);

  const toggleFavorite = useCallback(
    async (competition: CompetitionSlug, teamId: string) => {
      if (favorites[competition] === teamId) {
        await deleteFavorite(competition);
        setFavorites(({ [competition]: _removed, ...rest }) => rest);
      } else {
        await saveFavorite(competition, teamId);
        setFavorites((current) => ({ ...current, [competition]: teamId }));
      }
    },
    [favorites],
  );

  const setFavorite = useCallback(
    async (competition: CompetitionSlug, teamId: string | null) => {
      if (teamId === null) {
        await deleteFavorite(competition);
        setFavorites(({ [competition]: _removed, ...rest }) => rest);
      } else {
        await saveFavorite(competition, teamId);
        setFavorites((current) => ({ ...current, [competition]: teamId }));
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      setFavorite,
      isFavorite: (teamId: string) => Object.values(favorites).includes(teamId),
    }),
    [favorites, toggleFavorite, setFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  return useContext(FavoritesContext);
}
