import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { getSyncState } from '../database';
import { shouldSync, syncSnapshot } from './syncService';

/** How often an open app asks shouldSync whether to download again. */
const CHECK_EVERY_MS = 60 * 1000;

type SyncPhase = 'loading' | 'ready' | 'failed';

interface SyncContextValue {
  phase: SyncPhase;
  /** When the data was last checked: "Atualizado há 5 min". */
  lastSyncAt: number | null;
  /**
   * Which data is saved: changes only when a sync writes new data, so the
   * screens' queries (keyed by it) re-read only then, not on every check.
   */
  dataVersion: string | null;
  refreshing: boolean;
  refreshFailed: boolean;
  lastError: string | null;
  refresh: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  phase: 'loading',
  lastSyncAt: null,
  dataVersion: null,
  refreshing: false,
  refreshFailed: false,
  lastError: null,
  refresh: async () => {},
});

export function SyncProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<SyncPhase>('loading');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [dataVersion, setDataVersion] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const lastSyncRef = useRef<number | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback((): Promise<void> => {
    if (inFlight.current) return inFlight.current;

    setRefreshing(true);
    inFlight.current = syncSnapshot()
      .then(({ syncedAt, dataVersion: version }) => {
        lastSyncRef.current = syncedAt;
        setLastSyncAt(syncedAt);
        setDataVersion(version);
        setRefreshFailed(false);
        setLastError(null);
        setPhase('ready');
      })
      .catch((error: unknown) => {
        console.warn('Failed to sync Superliga data:', error);
        setRefreshFailed(true);
        setLastError(error instanceof Error ? error.message : String(error));
        setPhase(lastSyncRef.current === null ? 'failed' : 'ready');
      })
      .finally(() => {
        inFlight.current = null;
        setRefreshing(false);
      });
    return inFlight.current;
  }, []);

  const refreshIfNeeded = useCallback(async () => {
    if (await shouldSync(lastSyncRef.current, Date.now())) await refresh();
  }, [refresh]);

  useEffect(() => {
    (async () => {
      try {
        const { lastSyncAt: stored, snapshotKey } = await getSyncState();
        lastSyncRef.current = stored;
        setLastSyncAt(stored);
        // Data saved before snapshot keys existed: its sync time stands in.
        setDataVersion(
          snapshotKey ?? (stored === null ? null : String(stored)),
        );
        if (stored !== null) setPhase('ready');
        await refreshIfNeeded();
      } catch (error) {
        console.warn('Failed to read local data:', error);
        setLastError(
          `Banco local: ${error instanceof Error ? error.message : String(error)}`,
        );
        setPhase('failed');
      }
    })();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && lastSyncRef.current !== null) {
        refreshIfNeeded().catch(() => {});
      }
    });
    // While the app stays open (a game on screen), check again every minute;
    // shouldSync only downloads once the data is old for the moment (5 min
    // with a game on, 15 on match days, 6 h otherwise).
    const timer = setInterval(() => {
      if (AppState.currentState === 'active' && lastSyncRef.current !== null) {
        refreshIfNeeded().catch(() => {});
      }
    }, CHECK_EVERY_MS);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [refreshIfNeeded]);

  const value = useMemo(
    () => ({
      phase,
      lastSyncAt,
      dataVersion,
      refreshing,
      refreshFailed,
      lastError,
      refresh,
    }),
    [
      phase,
      lastSyncAt,
      dataVersion,
      refreshing,
      refreshFailed,
      lastError,
      refresh,
    ],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  return useContext(SyncContext);
}
