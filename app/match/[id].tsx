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
import { useTheme } from '../../src/contexts/ThemeContext';

export default function MatchDetailScreen() {
  const { id, sport } = useLocalSearchParams<{ id: string; sport: Sport }>();
  const { colors } = useTheme();
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
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Jogos' }} />
        <ActivityIndicator
          size="large"
          color={colors.primary}
          testID="activity-indicator"
        />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Jogos' }} />
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error ?? 'Jogo nao encontrado'}
        </Text>
      </View>
    );
  }

  const dateTime = formatMatchDateTime(match.date, match.hour);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen
        options={{
          title: 'Jogos',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => Alert.alert('Notificacoes', 'Em breve')}
            >
              <Text style={[styles.headerAction, { color: colors.primary }]}>
                Notificar-me
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.matchInfo, { backgroundColor: colors.surface }]}>
        <Text style={[styles.dateTime, { color: colors.textSecondary }]}>
          {dateTime}
        </Text>

        {match.status === 'match-live' && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
        )}
      </View>

      <View style={[styles.teamsSection, { backgroundColor: colors.surface }]}>
        <View style={styles.teamColumn}>
          <TeamCircle team={match.homeTeam} size={80} />
          <Text
            style={[styles.teamFullName, { color: colors.textPrimary }]}
            numberOfLines={2}
          >
            {match.homeTeam.name}
          </Text>
        </View>

        <View style={styles.scoreColumn}>
          {hasScore ? (
            <Text style={[styles.detailScore, { color: colors.textPrimary }]}>
              {match.score.type === 'football'
                ? `${match.score.goals.home ?? '-'} x ${match.score.goals.away ?? '-'}`
                : `${match.score.sets.home ?? '-'} x ${match.score.sets.away ?? '-'}`}
            </Text>
          ) : (
            <Text style={[styles.vsText, { color: colors.textTertiary }]}>
              x
            </Text>
          )}
        </View>

        <View style={styles.teamColumn}>
          <TeamCircle team={match.awayTeam} size={80} />
          <Text
            style={[styles.teamFullName, { color: colors.textPrimary }]}
            numberOfLines={2}
          >
            {match.awayTeam.name}
          </Text>
        </View>
      </View>

      {match.stadium !== '' && (
        <Text
          style={[
            styles.stadium,
            {
              color: colors.textSecondary,
              backgroundColor: colors.surface,
            },
          ]}
        >
          {match.stadium} - {match.location.city}
        </Text>
      )}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Onde Assistir
      </Text>

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
        <Text style={[styles.noBroadcast, { color: colors.textTertiary }]}>
          Transmissao nao definida
        </Text>
      )}

      {relatedMatches.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Proximos Jogos
          </Text>
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
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
  },
  headerAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  matchInfo: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  dateTime: {
    fontSize: 15,
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
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
  },
  teamFullName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  scoreColumn: {
    paddingHorizontal: 16,
  },
  detailScore: {
    fontSize: 28,
    fontWeight: '800',
  },
  vsText: {
    fontSize: 22,
    fontWeight: '600',
  },
  stadium: {
    fontSize: 13,
    textAlign: 'center',
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  bottomSpacer: {
    height: 32,
  },
});
