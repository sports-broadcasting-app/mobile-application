import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Match, VolleyballScore } from '../types/match';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const channels = match.broadcast.map((b) => b.name).join(', ');
  const hasScore = match.status !== 'match-not-started';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.time}>{match.hour}</Text>
        <Text style={styles.championship}>{match.championship.slug}</Text>
      </View>

      <View style={styles.teams}>
        <Text style={styles.teamName}>{match.homeTeam.name}</Text>
        {hasScore ? renderScore(match.score) : <Text style={styles.vs}>x</Text>}
        <Text style={styles.teamName}>{match.awayTeam.name}</Text>
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

      {channels ? (
        <View style={styles.broadcastRow}>
          <Text style={styles.broadcastLabel}>Onde assistir:</Text>
          <Text style={styles.broadcastChannels}>{channels}</Text>
        </View>
      ) : (
        <Text style={styles.noBroadcast}>Transmissao nao definida</Text>
      )}
    </View>
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
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  time: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  championship: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    flex: 1,
    textAlign: 'center',
  },
  vs: {
    fontSize: 14,
    color: '#999',
  },
  score: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    minWidth: 60,
    textAlign: 'center',
  },
  setDetail: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  broadcastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  broadcastLabel: {
    fontSize: 12,
    color: '#666',
  },
  broadcastChannels: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  noBroadcast: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
  },
});
