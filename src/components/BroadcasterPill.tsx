import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  maxFontScale,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

interface BroadcasterPillProps {
  name: string;
}

export const BroadcasterPill = React.memo(function BroadcasterPill({
  name,
}: BroadcasterPillProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.pill, { backgroundColor: colors.primarySoft }]}
      testID={`broadcaster-pill-${name}`}
    >
      <Text
        maxFontSizeMultiplier={maxFontScale}
        numberOfLines={1}
        style={[styles.text, { color: colors.primary }]}
      >
        {name}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
});
