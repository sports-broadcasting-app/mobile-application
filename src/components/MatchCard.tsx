import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Match, VolleyballScore } from '../types/match';
import { formatHour } from '../utils/dateFormat';

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
}

export function MatchCard({ match, onPress }: MatchCardProps) {
  const hasScore = match.status !== 'match-not-started';
  const isLive = match.status === 'match-live';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
      testID={`match-card-${match.id}`}
    >
      <View style={styles.topRow}>
        <Text style={styles.time}>{formatHour(match.hour)}</Text>
        {isLive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
        )}
      </View>

      <View style={styles.teamsRow}>
        <Text style={styles.teamName} numberOfLines={1}>
          {match.homeTeam.name}
        </Text>
        {hasScore ? renderScore(match.score) : <Text style={styles.vs}>x</Text>}
        <Text style={styles.teamName} numberOfLines={1}>
          {match.awayTeam.name}
        </Text>
      </View>

      {hasScore && match.score.type === 'volleyball' && (
        <Text style={styles.setDetail}>{renderSetScores(match.score)}</Text>
      )}

      {hasScore &&
        match.score.type === 'football' &&
        match.score.penalties.home !== null && (
          <Text style={styles.setDetail}>
            Penaltis: {match.score.penalties.home} x{' '}
            {match.score.penalties.away}
          </Text>
        )}

      <View style={styles.bottomRow}>
        {match.broadcast.length > 0 ? (
          <View style={styles.broadcastRow}>
            {match.broadcast.map((b) => (
              <View key={b.name} style={styles.broadcastBadge}>
                <Text style={styles.broadcastText}>{b.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noBroadcast}>Transmissao nao definida</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function renderScore(score: Match['score']): React.ReactNode {
  if (score.type === 'football') {
    return (
      <Text style={styles.score}>
        {score.goals.home ?? '-'} x {score.goals.away ?? '-'}
      </Text>
    );
  }
  return (
    <Text style={styles.score}>
      {score.sets.home ?? '-'} x {score.sets.away ?? '-'}
    </Text>
  );
}

function renderSetScores(score: VolleyballScore): string {
  return score.setScores.map((s) => `${s.home}-${s.away}`).join(' / ');
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
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
    color: '#333',
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
    color: '#111',
    flex: 1,
  },
  vs: {
    fontSize: 14,
    color: '#999',
  },
  score: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    minWidth: 50,
    textAlign: 'center',
  },
  setDetail: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  broadcastText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  noBroadcast: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
  },
});
