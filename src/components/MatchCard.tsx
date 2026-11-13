import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getCompetition } from '../constants/competitions';
import { useTheme } from '../contexts/ThemeContext';
import { Match, Team } from '../types/snapshot';
import { formatMatchDate, formatTime } from '../utils/date';
import { getTeamName } from '../utils/teamName';
import { BroadcasterPill } from './BroadcasterPill';
import { TeamCircle } from './TeamCircle';
import {
  iconSize,
  radius,
  shadows,
  spacing,
  typography,
} from '../constants/designTokens';

interface MatchCardProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  favorite?: boolean;
  showDate?: boolean;
  onPress?: () => void;
}

function TeamRow({ team, score }: { team: Team; score: number | null }) {
  const { colors } = useTheme();

  return (
    <View style={styles.teamRow}>
      <TeamCircle team={team} size={28} />
      <Text
        style={[styles.teamName, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {getTeamName(team.name)}
      </Text>
      {score !== null && (
        <Text style={[styles.score, { color: colors.textPrimary }]}>
          {score}
        </Text>
      )}
    </View>
  );
}

export const MatchCard = React.memo(function MatchCard({
  match,
  homeTeam,
  awayTeam,
  favorite = false,
  showDate = false,
  onPress,
}: MatchCardProps) {
  const { colors } = useTheme();
  const isLive = match.status === 'live';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={onPress}
      testID={`match-card-${match.id}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: favorite ? colors.primary : colors.borderLight,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {showDate
            ? formatMatchDate(match.startsAt)
            : formatTime(match.startsAt)}
          {` · ${getCompetition(match.competition).label}`}
        </Text>
        {favorite && (
          <MaterialCommunityIcons
            name="star"
            size={iconSize.sm}
            color={colors.primary}
            testID="favorite-star"
          />
        )}
        {isLive && (
          <View style={[styles.liveBadge, { backgroundColor: colors.error }]}>
            <Text style={[styles.liveText, { color: colors.textOnPrimary }]}>
              AO VIVO
            </Text>
          </View>
        )}
        {match.status === 'postponed' && (
          <Text style={[styles.meta, { color: colors.error }]}>Adiado</Text>
        )}
      </View>

      <TeamRow team={homeTeam} score={match.homeScore} />
      <TeamRow team={awayTeam} score={match.awayScore} />

      <View style={styles.channels}>
        <MaterialCommunityIcons
          name="television-classic"
          size={iconSize.sm}
          color={colors.textSecondary}
        />
        {match.channels.length > 0 ? (
          match.channels.map((channel) => (
            <BroadcasterPill key={channel} name={channel} />
          ))
        ) : (
          <Text style={[styles.meta, { color: colors.textTertiary }]}>
            Transmissão a definir
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    ...shadows.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  meta: {
    flexShrink: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  liveBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  liveText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  teamRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  teamName: {
    flex: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  score: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  channels: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
