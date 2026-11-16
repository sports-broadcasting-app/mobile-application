import { ReactNode, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from '../screens/OnboardingScreen';
import { useTheme } from '../contexts/ThemeContext';

export const ONBOARDING_KEY = '@onboarding_done';

/** Shows the onboarding once, before the app; its data is already local. */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((stored) => setDone(stored === 'true'))
      // Unreadable storage must not lock the user out of the app.
      .catch(() => setDone(true));
  }, []);

  const finish = useCallback(() => {
    setDone(true);
    AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
  }, []);

  if (done === null) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]} />
    );
  }
  if (!done) return <OnboardingScreen onFinish={finish} />;
  return children;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
