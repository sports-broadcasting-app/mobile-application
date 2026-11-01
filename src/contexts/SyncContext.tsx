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
import { getLastSyncAt } from '../data/database';
import { shouldSync, syncSnapshot } from '../services/syncService';

type SyncPhase = 'loading' | 'ready' | 'failed';

interface SyncContextValue {
  phase: SyncPhase;
  lastSyncAt: number | null;
  refreshing: boolean;
  refreshFailed: boolean;
  lastError: string | null;
  refresh: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  phase: 'loading',
  lastSyncAt: null,
  refreshing: false,
  refreshFailed: false,
  lastError: null,
  refresh: async () => {},
});

export function SyncProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<SyncPhase>('loading');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const lastSyncRef = useRef<number | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback((): Promise<void> => {
    if (inFlight.current) return inFlight.current;

    setRefreshing(true);
    inFlight.current = syncSnapshot()
      .then((syncedAt) => {
        lastSyncRef.current = syncedAt;
        setLastSyncAt(syncedAt);
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
        const stored = await getLastSyncAt();
        lastSyncRef.current = stored;
        setLastSyncAt(stored);
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
    return () => subscription.remove();
  }, [refreshIfNeeded]);

  const value = useMemo(
    () => ({
      phase,
      lastSyncAt,
      refreshing,
      refreshFailed,
      lastError,
      refresh,
    }),
    [phase, lastSyncAt, refreshing, refreshFailed, lastError, refresh],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  return useContext(SyncContext);
}
