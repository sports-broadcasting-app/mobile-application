/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: { testID?: string }) =>
      React.createElement(View, { testID: props.testID }),
  };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      style?: object;
    }) => React.createElement(View, props, children),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' }),
  ),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ data: 'ExponentPushToken[test]' }),
  ),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: { eas: { projectId: 'test-project-id' } },
  },
}));
