/* eslint-disable @typescript-eslint/no-require-imports */
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
  requestTrackingPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true }),
  ),
}));
