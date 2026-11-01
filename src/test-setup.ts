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
