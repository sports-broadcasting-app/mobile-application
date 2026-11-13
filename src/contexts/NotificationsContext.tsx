import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTeams, getUpcomingFavoriteMatches } from '../data/database';
import {
  getNotificationPermission,
  NotificationPermission,
  NOTIFICATIONS_SUPPORTED,
  replaceScheduledReminders,
  requestNotificationPermission,
} from '../services/notifications';
import {
  buildReminders,
  MAX_REMINDERS,
  REMINDER_LEAD_MS,
} from '../utils/reminders';
import { useFavorites } from './FavoritesContext';
import { useSync } from './SyncContext';

const STORAGE_KEY = '@match_reminders';

interface NotificationsContextValue {
  supported: boolean;
  /** The user's choice in the app and the system permission, both on. */
  enabled: boolean;
  /**
   * Turns the reminders on or off. Turning on asks for the system permission
   * and resolves to false when it was refused.
   */
  setEnabled: (enabled: boolean) => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  supported: false,
  enabled: false,
  setEnabled: async () => false,
});

/**
 * Keeps a local reminder before each match of the favorite teams. The pending
 * list is rebuilt whenever the favorites, the data or the choice change, so a
 * match moved by the source moves its reminder too.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { favorites } = useFavorites();
  const { lastSyncAt } = useSync();
  const [preference, setPreference] = useState<boolean | null>(null);
  const [permission, setPermission] =
    useState<NotificationPermission>('undetermined');
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!NOTIFICATIONS_SUPPORTED) return;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => setPreference(stored === 'on'))
      .catch(() => setPreference(false));

    const readPermission = () => {
      getNotificationPermission()
        .then(setPermission)
        .catch(() => {});
    };
    readPermission();
    // The user may have changed the permission in the system settings.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') readPermission();
    });
    return () => subscription.remove();
  }, []);

  const enabled = preference === true && permission === 'granted';

  useEffect(() => {
    if (preference === null) return;
    let cancelled = false;

    const run = async () => {
      if (!enabled) {
        await replaceScheduledReminders([]);
        return;
      }
      const now = Date.now();
      const [matches, teams] = await Promise.all([
        getUpcomingFavoriteMatches(
          favorites,
          now + REMINDER_LEAD_MS,
          MAX_REMINDERS,
        ),
        getTeams(),
      ]);
      // A newer run is queued: let it schedule instead.
      if (cancelled) return;
      const teamsById = new Map(teams.map((team) => [team.id, team]));
      await replaceScheduledReminders(buildReminders(matches, teamsById, now));
    };

    // One run at a time, so an older list never lands after a newer one.
    queue.current = queue.current.then(run).catch((error: unknown) => {
      console.warn('Failed to schedule match reminders:', error);
    });
    return () => {
      cancelled = true;
    };
  }, [preference, enabled, favorites, lastSyncAt]);

  const setEnabled = useCallback(async (next: boolean) => {
    if (!next) {
      setPreference(false);
      await AsyncStorage.setItem(STORAGE_KEY, 'off').catch(() => {});
      return true;
    }

    let status = await getNotificationPermission();
    if (status !== 'granted') status = await requestNotificationPermission();
    setPermission(status);
    if (status !== 'granted') return false;

    setPreference(true);
    await AsyncStorage.setItem(STORAGE_KEY, 'on').catch(() => {});
    return true;
  }, []);

  const value = useMemo(
    () => ({ supported: NOTIFICATIONS_SUPPORTED, enabled, setEnabled }),
    [enabled, setEnabled],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  return useContext(NotificationsContext);
}
