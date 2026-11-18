import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { Match, Team } from '../types/snapshot';
import { formatShortDay, formatTime } from '../utils/date';
import { getTeamName } from '../utils/teamName';
import {
  iconSize,
  maxFontScale,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

interface MatchRowProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  favorite?: boolean;
  onPress?: () => void;
}

/** A coming match in one line: day and time, the clubs, the first channel. */
export const MatchRow = React.memo(function MatchRow({
  match,
  homeTeam,
  awayTeam,
  favorite = false,
  onPress,
}: MatchRowProps) {
  const { colors } = useTheme();
  const date = new Date(match.startsAt);
  const when = `${formatShortDay(date)} · ${formatTime(match.startsAt)}`;
  const [channel] = match.channels;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={onPress}
      testID={`match-row-${match.id}`}
      style={[styles.row, { borderBottomColor: colors.borderLight }]}
    >
      <Text
        maxFontSizeMultiplier={maxFontScale}
        numberOfLines={1}
        style={[styles.when, { color: colors.textSecondary }]}
      >
        {when}
      </Text>
      <View style={styles.teams}>
        <Text
          maxFontSizeMultiplier={maxFontScale}
          numberOfLines={1}
          style={[styles.teamsText, { color: colors.textPrimary }]}
        >
          {`${getTeamName(homeTeam.name)} × ${getTeamName(awayTeam.name)}`}
        </Text>
        {favorite && (
          <MaterialCommunityIcons
            name="star"
            size={iconSize.sm}
            color={colors.primary}
          />
        )}
      </View>
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
    // Fits "dom 22 · 15:00" on one line with the system font at 100%.
    width: 112,
  },
  teams: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  teamsText: {
    flexShrink: 1,
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
