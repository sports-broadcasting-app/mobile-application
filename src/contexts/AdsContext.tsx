import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { startAds } from '../services/ads';

interface AdsContextValue {
  adsReady: boolean;
}

const AdsContext = createContext<AdsContextValue>({ adsReady: false });

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [adsReady, setAdsReady] = useState(false);

  useEffect(() => {
    let active = true;
    startAds()
      .then((ready) => {
        if (!ready) console.warn('Ads disabled: no consent to request ads');
        if (active) setAdsReady(ready);
      })
      // An ad failure must never take the app down; it just shows no ads.
      .catch((error) => console.warn('Failed to start ads:', error));
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ adsReady }), [adsReady]);

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds(): AdsContextValue {
  return useContext(AdsContext);
}
