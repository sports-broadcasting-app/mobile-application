import { Platform, Switch } from 'react-native';
import { render, screen } from '@/test/utils';
import { ThemedSwitch } from './ThemedSwitch';
import { lightTheme } from '@/shared/theme/theme';

describe('ThemedSwitch', () => {
  const original = Platform.OS;

  afterEach(() => {
    Platform.OS = original;
  });

  const switchProps = (value: boolean) => {
    render(<ThemedSwitch testID="switch" value={value} />);
    // The props given to React Native's Switch, before it maps them per platform.
    return screen.UNSAFE_getByType(Switch).props;
  };

  it('uses the primary color for the track when on', () => {
    expect(switchProps(true).trackColor).toEqual({ true: lightTheme.primary });
  });

  it('gives the Android thumb the controlThumb color when on', () => {
    Platform.OS = 'android';
    expect(switchProps(true).thumbColor).toBe(lightTheme.controlThumb);
  });

  it('keeps the system thumb when off, and always on iOS', () => {
    Platform.OS = 'android';
    expect(switchProps(false).thumbColor).toBeUndefined();
    Platform.OS = 'ios';
    expect(switchProps(true).thumbColor).toBeUndefined();
  });
});
