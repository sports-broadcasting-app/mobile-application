import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTodayMatches } from '../../src/hooks/useTodayMatches';
import { TeamCircle } from '../../src/components/TeamCircle';
import { BroadcastCard } from '../../src/components/BroadcastCard';
import { MatchCard } from '../../src/components/MatchCard';
import { formatMatchDateTime } from '../../src/utils/dateFormat';
import { Sport } from '../../src/types/match';

export default function MatchDetailScreen() {
  const { id, sport } = useLocalSearchParams<{ id: string; sport: Sport }>();
  const { matches, loading, error } = useTodayMatches(sport as Sport);

  const match = useMemo(() => matches.find((m) => m.id === id), [matches, id]);

  const relatedMatches = useMemo(() => {
    if (!match) return [];
    return matches.filter(
      (m) =>
        m.id !== match.id && m.championship.slug === match.championship.slug,
    );
  }, [matches, match]);

  const hasScore = match ? match.status !== 'match-not-started' : false;

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Jogos' }} />
        <ActivityIndicator
          size="large"
          color="#2563eb"
          testID="activity-indicator"
        />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Jogos' }} />
        <Text style={styles.errorText}>{error ?? 'Jogo nao encontrado'}</Text>
      </View>
    );
  }

  const dateTime = formatMatchDateTime(match.date, match.hour);

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Jogos',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => Alert.alert('Notificacoes', 'Em breve')}
            >
              <Text style={styles.headerAction}>Notificar-me</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.matchInfo}>
        <Text style={styles.dateTime}>{dateTime}</Text>

        {match.status === 'match-live' && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
        )}
      </View>

      <View style={styles.teamsSection}>
        <View style={styles.teamColumn}>
          <TeamCircle team={match.homeTeam} size={80} />
          <Text style={styles.teamFullName} numberOfLines={2}>
            {match.homeTeam.name}
          </Text>
        </View>

        <View style={styles.scoreColumn}>
          {hasScore ? (
            <Text style={styles.detailScore}>
              {match.score.type === 'football'
                ? `${match.score.goals.home ?? '-'} x ${match.score.goals.away ?? '-'}`
                : `${match.score.sets.home ?? '-'} x ${match.score.sets.away ?? '-'}`}
            </Text>
          ) : (
            <Text style={styles.vsText}>x</Text>
          )}
        </View>

        <View style={styles.teamColumn}>
          <TeamCircle team={match.awayTeam} size={80} />
          <Text style={styles.teamFullName} numberOfLines={2}>
            {match.awayTeam.name}
          </Text>
        </View>
      </View>

      {match.stadium !== '' && (
        <Text style={styles.stadium}>
          {match.stadium} - {match.location.city}
        </Text>
      )}

      <Text style={styles.sectionTitle}>Onde Assistir</Text>

      {match.broadcast.length > 0 ? (
        <FlatList
          data={match.broadcast}
          keyExtractor={(b) => b.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.broadcastList}
          renderItem={({ item }) => <BroadcastCard broadcast={item} />}
          scrollEnabled={false}
        />
      ) : (
        <Text style={styles.noBroadcast}>Transmissao nao definida</Text>
      )}

      {relatedMatches.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Proximos Jogos</Text>
          {relatedMatches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginHorizontal: 32,
  },
  headerAction: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  matchInfo: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  dateTime: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  liveBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 8,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  teamsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
  },
  teamFullName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    textAlign: 'center',
    marginTop: 10,
  },
  scoreColumn: {
    paddingHorizontal: 16,
  },
  detailScore: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
  },
  vsText: {
    fontSize: 22,
    color: '#999',
    fontWeight: '600',
  },
  stadium: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  broadcastList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  noBroadcast: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  bottomSpacer: {
    height: 32,
  },
});
