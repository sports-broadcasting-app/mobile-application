import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { fetchTeamLogos } from '../services/matchService';
import {
  getAllLogos,
  upsertAllLogos,
  shouldRefreshLogos,
} from '../services/teamLogoStore';

const TeamLogoContext = createContext<Map<string, string>>(new Map());

interface TeamLogoProviderProps {
  children: ReactNode;
}

export function TeamLogoProvider({ children }: TeamLogoProviderProps) {
  const [logos, setLogos] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Load from SQLite (instant)
      const cached = await getAllLogos();
      if (!cancelled && cached.size > 0) {
        setLogos(cached);
      }

      // 2. Refresh from API if stale
      const needsRefresh = cached.size === 0 || (await shouldRefreshLogos());
      if (needsRefresh) {
        try {
          const fresh = await fetchTeamLogos();
          await upsertAllLogos(fresh);
          if (!cancelled) {
            const map = new Map(Object.entries(fresh));
            setLogos(map);
          }
        } catch {
          // Keep cached data on network error
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TeamLogoContext.Provider value={logos}>
      {children}
    </TeamLogoContext.Provider>
  );
}

export function useTeamLogos(): Map<string, string> {
  return useContext(TeamLogoContext);
}
