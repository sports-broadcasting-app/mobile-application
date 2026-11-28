import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { AppText } from './AppText';
import { radius, spacing } from '@/shared/theme/designTokens';

interface BroadcasterPillProps {
  name: string;
  /** `sm` inside cards; `md` at the end of a one-line row. */
  size?: 'sm' | 'md';
}

/** Where a game or session is shown: every channel pill of the app. */
export const BroadcasterPill = React.memo(function BroadcasterPill({
  name,
  size = 'sm',
}: BroadcasterPillProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles[size], { backgroundColor: colors.primarySoft }]}
      testID={`broadcaster-pill-${name}`}
    >
      <AppText
        variant={size === 'sm' ? 'tiny' : 'captionStrong'}
        tone="accent"
        capped
        numberOfLines={1}
      >
        {name}
      </AppText>
    </View>
  );
});

const styles = StyleSheet.create({
  sm: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  md: {
    borderRadius: radius.sm + 2,
    maxWidth: 96,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
});
