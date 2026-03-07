import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Team, Sport } from '../types/match';
import { registerForPushNotifications } from '../services/notificationService';
import {
  registerSubscriber,
  unregisterSubscriber,
} from '../services/subscriberService';

const STORAGE_KEY = '@favorite_team';

interface FavoriteTeamData {
  team: Team;
  sport: Sport;
}

interface FavoriteTeamContextValue {
  favoriteTeam: FavoriteTeamData | null;
  setFavoriteTeam: (team: Team, sport: Sport) => Promise<void>;
  clearFavoriteTeam: () => Promise<void>;
  isFavorite: (teamSlug: string) => boolean;
  loading: boolean;
}

const FavoriteTeamContext = createContext<FavoriteTeamContextValue>({
  favoriteTeam: null,
  setFavoriteTeam: async () => {},
  clearFavoriteTeam: async () => {},
  isFavorite: () => false,
  loading: true,
});

interface FavoriteTeamProviderProps {
  children: ReactNode;
}

export function FavoriteTeamProvider({ children }: FavoriteTeamProviderProps) {
  const [favoriteTeam, setFavoriteTeamState] =
    useState<FavoriteTeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) {
          setFavoriteTeamState(JSON.parse(json) as FavoriteTeamData);
        }
      })
      .finally(() => setLoading(false));

    registerForPushNotifications()
      .then((token) => {
        if (token) setPushToken(token);
      })
      .catch(() => {});
  }, []);

  const setFavoriteTeam = useCallback(
    async (team: Team, sport: Sport) => {
      const data: FavoriteTeamData = { team, sport };
      setFavoriteTeamState(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      if (pushToken) {
        registerSubscriber(pushToken, team.slug, sport).catch((err) =>
          console.warn('Failed to register subscriber:', err),
        );
      }
    },
    [pushToken],
  );

  const clearFavoriteTeam = useCallback(async () => {
    setFavoriteTeamState(null);
    await AsyncStorage.removeItem(STORAGE_KEY);

    if (pushToken) {
      unregisterSubscriber(pushToken).catch((err) =>
        console.warn('Failed to unregister subscriber:', err),
      );
    }
  }, [pushToken]);

  const isFavorite = useCallback(
    (teamSlug: string) => favoriteTeam?.team.slug === teamSlug,
    [favoriteTeam],
  );

  const value = useMemo(
    () => ({
      favoriteTeam,
      setFavoriteTeam,
      clearFavoriteTeam,
      isFavorite,
      loading,
    }),
    [favoriteTeam, setFavoriteTeam, clearFavoriteTeam, isFavorite, loading],
  );

  return (
    <FavoriteTeamContext.Provider value={value}>
      {children}
    </FavoriteTeamContext.Provider>
  );
}

export function useFavoriteTeam(): FavoriteTeamContextValue {
  return useContext(FavoriteTeamContext);
}
