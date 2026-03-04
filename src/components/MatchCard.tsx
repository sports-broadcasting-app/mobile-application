import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Match, VolleyballScore } from '../types/match';
import { formatHour } from '../utils/dateFormat';
import { useTheme } from '../contexts/ThemeContext';

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
      <View style={styles.topRow}>
        <Text style={[styles.time, { color: colors.textPrimary }]}>
          {formatHour(match.hour)}
        </Text>
        {isLive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
        )}
      </View>

      <View style={styles.teamsRow}>
        <Text
          style={[styles.teamName, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {match.homeTeam.name}
        </Text>
        {hasScore ? (
          renderScore(match.score, colors.textPrimary)
        ) : (
          <Text style={[styles.vs, { color: colors.textTertiary }]}>x</Text>
        )}
        <Text
          style={[styles.teamName, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {match.awayTeam.name}
        </Text>
      </View>

      {hasScore && match.score.type === 'volleyball' && (
        <Text style={[styles.setDetail, { color: colors.textSecondary }]}>
          {renderSetScores(match.score)}
        </Text>
      )}

      {hasScore &&
        match.score.type === 'football' &&
        match.score.penalties.home !== null && (
          <Text style={[styles.setDetail, { color: colors.textSecondary }]}>
            Penaltis: {match.score.penalties.home} x{' '}
            {match.score.penalties.away}
          </Text>
        )}

      <View style={styles.bottomRow}>
        {match.broadcast.length > 0 ? (
          <View style={styles.broadcastRow}>
            {match.broadcast.map((b) => (
              <View
                key={b.name}
                style={[
                  styles.broadcastBadge,
                  { backgroundColor: colors.broadcastBadgeBg },
                ]}
              >
                <Text style={[styles.broadcastText, { color: colors.primary }]}>
                  {b.name}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.noBroadcast, { color: colors.textTertiary }]}>
            Transmissao nao definida
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function renderScore(score: Match['score'], color: string): React.ReactNode {
  if (score.type === 'football') {
    return (
      <Text style={[styles.score, { color }]}>
        {score.goals.home ?? '-'} x {score.goals.away ?? '-'}
      </Text>
    );
  }
  return (
    <Text style={[styles.score, { color }]}>
      {score.sets.home ?? '-'} x {score.sets.away ?? '-'}
    </Text>
  );
}

function renderSetScores(score: VolleyballScore): string {
  return score.setScores.map((s) => `${s.home}-${s.away}`).join(' / ');
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  time: {
    fontSize: 15,
    fontWeight: '700',
  },
  liveBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  vs: {
    fontSize: 14,
  },
  score: {
    fontSize: 18,
    fontWeight: '800',
    minWidth: 50,
    textAlign: 'center',
  },
  setDetail: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  broadcastRow: {
    flexDirection: 'row',
    gap: 6,
  },
  broadcastBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  broadcastText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noBroadcast: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
