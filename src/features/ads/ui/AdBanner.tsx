import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useAds } from '../model/AdsContext';
import { BANNER_UNIT_IDS } from '../config/ads';
import { IS_STORE_BUILD } from '@/shared/config/buildInfo';
import { spacing } from '@/shared/theme/designTokens';

// Real ads only in store builds: tapping a real ad in development or on a
// preview build counts as invalid traffic and can get the AdMob account banned.
const USE_REAL_ADS = IS_STORE_BUILD;

const UNIT_ID = USE_REAL_ADS
  ? Platform.select({
      ios: BANNER_UNIT_IDS.ios,
      default: BANNER_UNIT_IDS.android,
    })
  : TestIds.ADAPTIVE_BANNER;

// Anchored adaptive: full width with a short fixed height (a strip). It lives at
// the end of the scrolling content so the floating native tab bar never covers it.
export function AdBanner() {
  const { adsReady } = useAds();
  const [failed, setFailed] = useState(false);

  if (!adsReady || failed) return null;

  return (
    <View style={styles.container} testID="ad-banner">
      <BannerAd
        unitId={UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={(error) => {
          console.warn('Ad failed to load:', error.message);
          setFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
});
