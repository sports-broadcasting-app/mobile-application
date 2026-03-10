import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Match, MatchScore, VolleyballScore } from '../types/match';
import { formatHour } from '../utils/dateFormat';
import { useTheme } from '../contexts/ThemeContext';
import { TeamCircle } from './TeamCircle';
import { VsBadge } from './VsBadge';
import { BroadcasterPill } from './BroadcasterPill';

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
}

export function MatchCard({ match, onPress }: MatchCardProps) {
  const { colors } = useTheme();
  const hasScore = match.status !== 'match-not-started';
  const isLive = match.status === 'match-live';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surface, shadowColor: colors.shadow },
      ]}
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
                <Text style={[styles.scoreText, { color: colors.textPrimary }]}>
                  {renderScoreText(match.score)}
                </Text>
              ) : (
                <VsBadge size={22} />
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
                    style={[styles.setDetail, { color: colors.textSecondary }]}
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
          size={20}
          color={colors.textTertiary}
        />
      </View>
    </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  timeColumn: {
    alignItems: 'center',
    minWidth: 48,
  },
  time: {
    fontSize: 14,
    fontWeight: '700',
  },
  liveBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 4,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  matchContent: {
    flex: 1,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 32,
    paddingVertical: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '800',
  },
  setDetail: {
    fontSize: 10,
  },
  rightColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  broadcastColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  moreText: {
    fontSize: 10,
    fontWeight: '600',
  },
  noBroadcast: {
    fontSize: 10,
    fontStyle: 'italic',
    maxWidth: 60,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
