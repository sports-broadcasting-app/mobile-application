import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { RaceSession } from '../types/snapshot';
import { formatShortDay, formatTime } from '../utils/date';
import { describeSession } from '../utils/sessions';
import {
  maxFontScale,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

interface SessionRowProps {
  session: RaceSession;
  onPress?: () => void;
}

/** A coming race session in one line, like MatchRow: day, time, the GP. */
export const SessionRow = React.memo(function SessionRow({
  session,
  onPress,
}: SessionRowProps) {
  const { colors } = useTheme();
  const date = new Date(session.startsAt);
  const [channel] = session.channels;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={describeSession(session, [formatShortDay(date)])}
      accessibilityHint={onPress ? 'Abre o fim de semana do GP' : undefined}
      testID={`session-row-${session.id}`}
      style={[styles.row, { borderBottomColor: colors.borderLight }]}
    >
      <Text
        maxFontSizeMultiplier={maxFontScale}
        numberOfLines={1}
        style={[styles.when, { color: colors.textSecondary }]}
      >
        {`${formatShortDay(date)} · ${formatTime(session.startsAt)}`}
      </Text>
      <Text
        maxFontSizeMultiplier={maxFontScale}
        numberOfLines={2}
        style={[styles.what, { color: colors.textPrimary }]}
      >
        {`${session.grandPrix} · ${session.name}`}
      </Text>
      {channel ? (
        <View style={[styles.channel, { backgroundColor: colors.primarySoft }]}>
          <Text
            maxFontSizeMultiplier={maxFontScale}
            numberOfLines={1}
            style={[styles.channelText, { color: colors.primary }]}
          >
            {channel}
          </Text>
        </View>
      ) : (
        <Text
          maxFontSizeMultiplier={maxFontScale}
          style={[styles.tbd, { color: colors.textTertiary }]}
        >
          a definir
        </Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingVertical: spacing.sm,
  },
  when: {
    fontSize: typography.size.sm + 1,
    fontWeight: typography.weight.medium,
    width: 112,
  },
  what: {
    flex: 1,
    fontSize: typography.size.body + 1,
    fontWeight: typography.weight.semibold,
  },
  channel: {
    borderRadius: radius.sm + 2,
    maxWidth: 96,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  channelText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  tbd: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
});
