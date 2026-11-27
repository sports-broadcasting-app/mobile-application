import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { radius } from '../constants/designTokens';

interface CardProps {
  children: ReactNode;
  /** Spacing and anything on top of the surface and the corners. */
  style?: StyleProp<ViewStyle> | undefined;
  testID?: string | undefined;
}

/** A group of rows on the surface color, with rounded corners. */
export function Card({ children, style, testID }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={[styles.card, { backgroundColor: colors.surface }, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
