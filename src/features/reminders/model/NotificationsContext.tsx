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
import {
  Favorites,
  getTeams,
  getUpcomingFavoriteMatches,
  getUpcomingSessions,
} from '@/shared/api/database';
import { SessionKind } from '@/shared/api/snapshot';
import { parseJson } from '@/shared/lib/json';
import { getCompetition } from '@/shared/config/competitions';
import {
  DEFAULT_REMINDER_KINDS,
  REMINDER_KINDS,
} from '@/entities/session/lib/sessions';
import {
  getNotificationPermission,
  hasExactAlarms,
  NotificationPermission,
  NOTIFICATIONS_SUPPORTED,
  replaceScheduledReminders,
  requestExactAlarms as requestExactAlarmsPermission,
  requestNotificationPermission,
} from '../api/notifications';
import {
  buildReminders,
  buildSessionReminders,
  MAX_REMINDERS,
  REMINDER_LEAD_MS,
  sortReminders,
} from '../lib/reminders';
import { useCompetition } from '@/entities/competition/model/CompetitionContext';
import { useFavorites } from '@/entities/team/model/FavoritesContext';
import { useSync } from '@/shared/api/sync/SyncContext';

const STORAGE_KEY = '@match_reminders';
/** The Formula 1 session kinds to warn about (no team to follow there). */
export const SESSION_KINDS_KEY = '@session_reminder_kinds';

interface NotificationsContextValue {
  supported: boolean;
  /** The user's choice in the app and the system permission, both on. */
  enabled: boolean;
  /**
   * Turns the reminders on or off. Turning on asks for the system permission
   * and resolves to false when it was refused.
   */
  setEnabled: (enabled: boolean) => Promise<boolean>;
  /**
   * Whether reminders fire on time. Android 14+ needs the user to allow
   * "Alarms & reminders"; without it they may arrive up to an hour late.
   */
  exactAlarms: boolean;
  /** Opens the system screen to allow exact alarms; resolves on return. */
  requestExactAlarms: () => Promise<boolean>;
  /** Race session kinds with a reminder (Formula 1). */
  sessionKinds: SessionKind[];
  setSessionKind: (kind: SessionKind, on: boolean) => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  supported: false,
  enabled: false,
  setEnabled: async () => false,
  exactAlarms: true,
  requestExactAlarms: async () => true,
  sessionKinds: DEFAULT_REMINDER_KINDS,
  setSessionKind: () => {},
});

/**
 * Keeps a local reminder before each match of the favorite teams. The pending
 * list is rebuilt whenever the favorites, the data or the choice change, so a
 * match moved by the source moves its reminder too.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { favorites: allFavorites } = useFavorites();
  const { followed } = useCompetition();
  const { lastSyncAt } = useSync();
  // Only competitions the user follows get reminders.
  const favorites = useMemo(() => {
    const own: Favorites = {};
    for (const slug of followed) {
      const team = allFavorites[slug];
      if (team) own[slug] = team;
    }
    return own;
  }, [allFavorites, followed]);
  const [preference, setPreference] = useState<boolean | null>(null);
  const [permission, setPermission] =
    useState<NotificationPermission>('undetermined');
  const [exactAlarms, setExactAlarms] = useState(true);
  const [sessionKinds, setSessionKinds] = useState<SessionKind[]>(
    DEFAULT_REMINDER_KINDS,
  );
  // Followed series (Formula 1): their reminders go by session kind.
  const series = useMemo(
    () =>
      followed.filter((slug) => getCompetition(slug).sport === 'automobilismo'),
    [followed],
  );
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!NOTIFICATIONS_SUPPORTED) return;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => setPreference(stored === 'on'))
      .catch(() => setPreference(false));
    AsyncStorage.getItem(SESSION_KINDS_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed = parseJson(stored);
        if (!Array.isArray(parsed)) return;
        setSessionKinds(
          REMINDER_KINDS.map(({ kind }) => kind).filter((kind) =>
            parsed.includes(kind),
          ),
        );
      })
      .catch(() => {});

    const readPermission = () => {
      getNotificationPermission()
        .then(setPermission)
        .catch(() => {});
      hasExactAlarms()
        .then(setExactAlarms)
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
      const [matches, teams, sessions] = await Promise.all([
        getUpcomingFavoriteMatches(
          favorites,
          now + REMINDER_LEAD_MS,
          MAX_REMINDERS,
        ),
        getTeams(),
        getUpcomingSessions(
          series,
          sessionKinds,
          now + REMINDER_LEAD_MS,
          MAX_REMINDERS,
        ),
      ]);
      // A newer run is queued: let it schedule instead.
      if (cancelled) return;
      const teamsById = new Map(teams.map((team) => [team.id, team]));
      await replaceScheduledReminders(
        sortReminders([
          ...buildReminders(matches, teamsById, now),
          ...buildSessionReminders(sessions, now),
        ]),
      );
    };

    // One run at a time, so an older list never lands after a newer one.
    queue.current = queue.current.then(run).catch((error: unknown) => {
      console.warn('Failed to schedule match reminders:', error);
    });
    return () => {
      cancelled = true;
    };
    // exactAlarms: alarms set while it was off stay inexact until replaced.
  }, [
    preference,
    enabled,
    exactAlarms,
    favorites,
    series,
    sessionKinds,
    lastSyncAt,
  ]);

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

  const setSessionKind = useCallback((kind: SessionKind, on: boolean) => {
    setSessionKinds((current) => {
      const next = REMINDER_KINDS.map((entry) => entry.kind).filter((k) =>
        k === kind ? on : current.includes(k),
      );
      AsyncStorage.setItem(SESSION_KINDS_KEY, JSON.stringify(next)).catch(
        () => {},
      );
      return next;
    });
  }, []);

  const requestExactAlarms = useCallback(async () => {
    const granted = await requestExactAlarmsPermission();
    setExactAlarms(granted);
    return granted;
  }, []);

  const value = useMemo(
    () => ({
      supported: NOTIFICATIONS_SUPPORTED,
      enabled,
      setEnabled,
      exactAlarms,
      requestExactAlarms,
      sessionKinds,
      setSessionKind,
    }),
    [
      enabled,
      setEnabled,
      exactAlarms,
      requestExactAlarms,
      sessionKinds,
      setSessionKind,
    ],
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
