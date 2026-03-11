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
  registerSubscriberTeams,
  unregisterSubscriber,
} from '../services/subscriberService';

const STORAGE_KEY = '@favorite_teams';
const OLD_STORAGE_KEY = '@favorite_team';
const SUBSCRIBER_REGISTERED_KEY = '@subscriber_registered';

export interface FavoriteTeamEntry {
  team: Team;
  sport: Sport;
}

interface FavoriteTeamsContextValue {
  favoriteTeams: FavoriteTeamEntry[];
  addFavoriteTeam: (team: Team, sport: Sport) => Promise<void>;
  removeFavoriteTeam: (teamSlug: string) => Promise<void>;
  clearAllFavoriteTeams: () => Promise<void>;
  isFavorite: (teamSlug: string) => boolean;
  loading: boolean;
}

const FavoriteTeamsContext = createContext<FavoriteTeamsContextValue>({
  favoriteTeams: [],
  addFavoriteTeam: async () => {},
  removeFavoriteTeam: async () => {},
  clearAllFavoriteTeams: async () => {},
  isFavorite: () => false,
  loading: true,
});

interface FavoriteTeamsProviderProps {
  children: ReactNode;
}

async function syncWithBackend(teams: FavoriteTeamEntry[]): Promise<void> {
  try {
    const token = await registerForPushNotifications();
    if (!token) return;

    if (teams.length === 0) {
      await unregisterSubscriber(token);
      await AsyncStorage.removeItem(SUBSCRIBER_REGISTERED_KEY);
      return;
    }

    await registerSubscriberTeams(
      token,
      teams.map((t) => ({ teamSlug: t.team.slug, sport: t.sport })),
    );
    await AsyncStorage.setItem(SUBSCRIBER_REGISTERED_KEY, token);
  } catch (err) {
    console.warn('Failed to sync subscriber:', err);
  }
}

export function FavoriteTeamsProvider({
  children,
}: FavoriteTeamsProviderProps) {
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeamEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Try new format first
        let teamsJson = await AsyncStorage.getItem(STORAGE_KEY);

        // Migration from old single-team format
        if (!teamsJson) {
          const oldJson = await AsyncStorage.getItem(OLD_STORAGE_KEY);
          if (oldJson) {
            const oldData = JSON.parse(oldJson) as FavoriteTeamEntry;
            const migrated = [oldData];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            await AsyncStorage.removeItem(OLD_STORAGE_KEY);
            await AsyncStorage.removeItem(SUBSCRIBER_REGISTERED_KEY);
            teamsJson = JSON.stringify(migrated);
          }
        }

        if (!teamsJson) return;

        const teams = JSON.parse(teamsJson) as FavoriteTeamEntry[];
        setFavoriteTeams(teams);

        // Check if we need to register with backend
        const registeredToken = await AsyncStorage.getItem(
          SUBSCRIBER_REGISTERED_KEY,
        );
        if (!registeredToken && teams.length > 0) {
          await syncWithBackend(teams);
        }
      } catch (err) {
        console.warn('Failed to initialize favorite teams:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addFavoriteTeam = useCallback(
    async (team: Team, sport: Sport) => {
      const updated = [
        ...favoriteTeams.filter((f) => f.team.slug !== team.slug),
        { team, sport },
      ];
      setFavoriteTeams(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      await syncWithBackend(updated);
    },
    [favoriteTeams],
  );

  const removeFavoriteTeam = useCallback(
    async (teamSlug: string) => {
      const updated = favoriteTeams.filter((f) => f.team.slug !== teamSlug);
      setFavoriteTeams(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      await syncWithBackend(updated);
    },
    [favoriteTeams],
  );

  const clearAllFavoriteTeams = useCallback(async () => {
    setFavoriteTeams([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await syncWithBackend([]);
  }, []);

  const isFavorite = useCallback(
    (teamSlug: string) => favoriteTeams.some((f) => f.team.slug === teamSlug),
    [favoriteTeams],
  );

  const value = useMemo(
    () => ({
      favoriteTeams,
      addFavoriteTeam,
      removeFavoriteTeam,
      clearAllFavoriteTeams,
      isFavorite,
      loading,
    }),
    [
      favoriteTeams,
      addFavoriteTeam,
      removeFavoriteTeam,
      clearAllFavoriteTeams,
      isFavorite,
      loading,
    ],
  );

  return (
    <FavoriteTeamsContext.Provider value={value}>
      {children}
    </FavoriteTeamsContext.Provider>
  );
}

export function useFavoriteTeams(): FavoriteTeamsContextValue {
  return useContext(FavoriteTeamsContext);
}
