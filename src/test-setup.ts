/* eslint-disable @typescript-eslint/no-require-imports */
import { configure } from '@testing-library/react-native';

// findBy*/waitFor give up after 1 s by default. On the cold CI runner the
// screen tests (which load every screen module) sometimes need more: six of
// them failed on main with "Unable to find" while the same code passed on the
// PR run. 5 s still fails fast on a real miss.
configure({ asyncUtilTimeout: 5_000 });

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: { testID?: string }) =>
      React.createElement(View, { testID: props.testID }),
  };
});

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: View };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-google-mobile-ads', () => {
  const React = require('react');
  const { View } = require('react-native');
  const initialize = jest.fn(() => Promise.resolve([]));
  return {
    __esModule: true,
    default: () => ({ initialize }),
    AdsConsent: {
      gatherConsent: jest.fn(() => Promise.resolve({ canRequestAds: true })),
      getConsentInfo: jest.fn(() => Promise.resolve({ canRequestAds: true })),
    },
    BannerAd: (props: object) =>
      React.createElement(View, { testID: 'banner-ad', ...props }),
    BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
    TestIds: { ADAPTIVE_BANNER: 'test-adaptive-banner' },
  };
});

jest.mock('expo-tracking-transparency', () => ({
  // Already answered by default; ads.test covers the first prompt.
  getTrackingPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: 'granted' }),
  ),
  requestTrackingPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: 'granted' }),
  ),
}));
