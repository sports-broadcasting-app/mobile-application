import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { startAds } from '../api/ads';

interface AdsContextValue {
  adsReady: boolean;
  /** Starts consent, the tracking prompt and the SDK; safe to call again. */
  start: () => void;
}

const AdsContext = createContext<AdsContextValue>({
  adsReady: false,
  start: () => {},
});

/**
 * Holds whether ads may load. Nothing starts on mount: `AdsStarter` calls
 * `start` once the first screen is up, so the consent form and the iOS
 * tracking prompt never cover the splash or the first-run download.
 */
export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [adsReady, setAdsReady] = useState(false);
  const running = useRef(false);
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const start = useCallback(() => {
    if (running.current) return;
    running.current = true;
    startAds()
      .then((ready) => {
        if (mounted.current && ready) setAdsReady(true);
      })
      // An ad failure must never take the app down; it just shows no ads.
      .catch((error) => console.warn('Failed to start ads:', error))
      .finally(() => {
        running.current = false;
      });
  }, []);

  const value = useMemo(() => ({ adsReady, start }), [adsReady, start]);

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds(): AdsContextValue {
  return useContext(AdsContext);
}

/**
 * Mounted after the first sync and onboarding. Starts ads, and tries again
 * each time the app comes back to the foreground until they are ready (the
 * tracking prompt may not have been shown yet).
 */
export function AdsStarter() {
  const { adsReady, start } = useAds();

  useEffect(() => {
    if (adsReady) return;
    start();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
    });
    return () => subscription.remove();
  }, [adsReady, start]);

  return null;
}
