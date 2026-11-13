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
} from '../data/database';
import { CompetitionSlug } from '../types/snapshot';

interface FavoritesContextValue {
  favorites: Favorites;
  toggleFavorite: (
    competition: CompetitionSlug,
    teamId: string,
  ) => Promise<void>;
  isFavorite: (teamId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: {},
  toggleFavorite: async () => {},
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

  const value = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite: (teamId: string) => Object.values(favorites).includes(teamId),
    }),
    [favorites, toggleFavorite],
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
