import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Match, MatchScore, VolleyballScore } from '../types/match';
import { formatHour } from '../utils/dateFormat';
import { useTheme } from '../contexts/ThemeContext';
import { TeamCircle } from './TeamCircle';
import { BroadcasterPill } from './BroadcasterPill';
import {
  spacing,
  radius,
  typography,
  iconSize,
  shadows,
} from '../constants/designTokens';

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
  onPressReminder?: (match: Match) => void;
  onPressWatch?: (match: Match) => void;
}

export function MatchCard({
  match,
  onPress,
  onPressReminder,
  onPressWatch,
}: MatchCardProps) {
  const { colors } = useTheme();
  const hasScore = match.status !== 'match-not-started';
  const isLive = match.status === 'match-live';
  const isTeamMatch = match.sport !== 'formula1';
  const showActions = isTeamMatch && match.status !== 'match-ended';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.borderLight,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardContent}
        activeOpacity={0.7}
        onPress={onPress}
        disabled={!onPress}
        testID={`match-card-${match.id}`}
      >
        {/* Time column */}
        <View style={styles.timeColumn}>
          <Text style={[styles.time, { color: colors.textPrimary }]}>
            {formatHour(match.hour)}
          </Text>
          {isLive && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>AO VIVO</Text>
            </View>
          )}
        </View>

        {/* Match content */}
        <View style={styles.matchContent}>
          {match.sport === 'formula1' ? (
            <View>
              <Text
                style={[styles.eventName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {match.eventName}
              </Text>
              <Text
                style={[styles.sessionLabel, { color: colors.textSecondary }]}
              >
                {match.sessionLabel}
              </Text>
            </View>
          ) : (
            <View>
              <View style={styles.teamRow}>
                <TeamCircle team={match.homeTeam} size={24} />
                <Text
                  style={[styles.teamName, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {match.homeTeam.name}
                </Text>
              </View>
              <View style={styles.separatorRow}>
                {hasScore ? (
                  <Text
                    style={[styles.scoreText, { color: colors.textPrimary }]}
                  >
                    {renderScoreText(match.score)}
                  </Text>
                ) : (
                  <Text style={[styles.vsText, { color: colors.textTertiary }]}>
                    vs
                  </Text>
                )}
                {hasScore && match.score.type === 'volleyball' && (
                  <Text
                    style={[styles.setDetail, { color: colors.textSecondary }]}
                  >
                    {renderSetScores(match.score)}
                  </Text>
                )}
                {hasScore &&
                  match.score.type === 'football' &&
                  match.score.penalties.home !== null && (
                    <Text
                      style={[
                        styles.setDetail,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Penaltis: {match.score.penalties.home} x{' '}
                      {match.score.penalties.away}
                    </Text>
                  )}
              </View>
              <View style={styles.teamRow}>
                <TeamCircle team={match.awayTeam} size={24} />
                <Text
                  style={[styles.teamName, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {match.awayTeam.name}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Broadcast + chevron */}
        <View style={styles.rightColumn}>
          {match.broadcast.length > 0 ? (
            <View style={styles.broadcastColumn}>
              {match.broadcast.slice(0, 2).map((b) => (
                <BroadcasterPill key={b.name} name={b.name} />
              ))}
              {match.broadcast.length > 2 && (
                <Text style={[styles.moreText, { color: colors.textTertiary }]}>
                  +{match.broadcast.length - 2}
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.noBroadcast, { color: colors.textTertiary }]}>
              Transmissao nao definida
            </Text>
          )}
          <MaterialCommunityIcons
            name="chevron-right"
            size={iconSize.md}
            color={colors.textTertiary}
          />
        </View>
      </TouchableOpacity>

      {/* Action buttons */}
      {showActions && (
        <View
          style={[styles.actionsRow, { borderTopColor: colors.borderLight }]}
        >
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: colors.reminderBtnBg },
            ]}
            onPress={() => onPressReminder?.(match)}
            testID={`reminder-btn-${match.id}`}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={iconSize.sm}
              color={colors.reminderBtnText}
            />
            <Text
              style={[styles.actionBtnText, { color: colors.reminderBtnText }]}
            >
              Lembrar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.watchBtnBg }]}
            onPress={() => onPressWatch?.(match)}
            testID={`watch-btn-${match.id}`}
          >
            <MaterialCommunityIcons
              name="play"
              size={iconSize.sm}
              color={colors.watchBtnText}
            />
            <Text
              style={[styles.actionBtnText, { color: colors.watchBtnText }]}
            >
              Assistir
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function renderScoreText(score: MatchScore): string {
  if (score.type === 'football') {
    return `${score.goals.home ?? '-'} x ${score.goals.away ?? '-'}`;
  }
  return `${score.sets.home ?? '-'} x ${score.sets.away ?? '-'}`;
}

function renderSetScores(score: VolleyballScore): string {
  return score.setScores.map((s) => `${s.home}-${s.away}`).join(' / ');
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    borderWidth: 1,
    ...shadows.sm,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  timeColumn: {
    alignItems: 'center',
    minWidth: 48,
  },
  time: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
  },
  liveBadge: {
    backgroundColor: '#dc2626',
    borderRadius: radius.sm / 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: spacing.xs,
  },
  liveText: {
    fontSize: 9,
    fontWeight: typography.weight.bold,
    color: '#fff',
  },
  matchContent: {
    flex: 1,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  teamName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
    flex: 1,
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 32,
    paddingVertical: spacing.xs,
  },
  vsText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  scoreText: {
    fontSize: typography.size.body,
    fontWeight: '800',
  },
  setDetail: {
    fontSize: typography.size.xs,
  },
  rightColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  broadcastColumn: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  moreText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  noBroadcast: {
    fontSize: typography.size.xs,
    fontStyle: 'italic',
    maxWidth: 60,
  },
  eventName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  sessionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  actionBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
