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
import { Alert } from 'react-native';
import { Team, Sport } from '../types/match';
import { registerForPushNotifications } from '../services/notificationService';
import {
  registerSubscriber,
  unregisterSubscriber,
} from '../services/subscriberService';

const STORAGE_KEY = '@favorite_team';
const SUBSCRIBER_REGISTERED_KEY = '@subscriber_registered';

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

async function ensureSubscriberRegistered(
  favoriteTeam: FavoriteTeamData,
): Promise<string | null> {
  const token = await registerForPushNotifications();
  if (!token) {
    Alert.alert(
      'Debug',
      'Push token is null — permission denied or unavailable',
    );
    return null;
  }

  try {
    await registerSubscriber(token, favoriteTeam.team.slug, favoriteTeam.sport);
    await AsyncStorage.setItem(SUBSCRIBER_REGISTERED_KEY, token);
    Alert.alert(
      'Debug',
      `Subscriber registered!\nToken: ${token.slice(0, 40)}...\nTeam: ${favoriteTeam.team.slug}\nSport: ${favoriteTeam.sport}`,
    );
    return token;
  } catch (err) {
    Alert.alert(
      'Debug',
      `Register failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw err;
  }
}

export function FavoriteTeamProvider({ children }: FavoriteTeamProviderProps) {
  const [favoriteTeam, setFavoriteTeamState] =
    useState<FavoriteTeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);

  // On startup: load favorite team + check if subscriber needs to be registered
  useEffect(() => {
    (async () => {
      try {
        const [teamJson, registeredToken] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SUBSCRIBER_REGISTERED_KEY),
        ]);

        if (!teamJson) return;

        const team = JSON.parse(teamJson) as FavoriteTeamData;
        setFavoriteTeamState(team);

        if (registeredToken) {
          // Already registered, just save the token
          setPushToken(registeredToken);
        } else {
          // Has favorite team but never registered — register now
          const token = await ensureSubscriberRegistered(team);
          if (token) setPushToken(token);
        }
      } catch (err) {
        console.warn('Failed to initialize favorite team:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setFavoriteTeam = useCallback(async (team: Team, sport: Sport) => {
    const data: FavoriteTeamData = { team, sport };
    setFavoriteTeamState(data);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // Always register on team change (new team = new subscriber)
    try {
      const token = await ensureSubscriberRegistered(data);
      if (token) setPushToken(token);
    } catch (err) {
      console.warn('Failed to register subscriber:', err);
    }
  }, []);

  const clearFavoriteTeam = useCallback(async () => {
    setFavoriteTeamState(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(SUBSCRIBER_REGISTERED_KEY);

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
