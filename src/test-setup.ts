/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: { testID?: string }) =>
      React.createElement(View, { testID: props.testID }),
  };
});
