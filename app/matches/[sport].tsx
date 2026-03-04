import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTodayMatches } from '../../src/hooks/useTodayMatches';
import { MatchCard } from '../../src/components/MatchCard';
import { getChampionshipLabel } from '../../src/utils/championshipLabel';
import { Match, Sport } from '../../src/types/match';

export default function MatchesScreen() {
  const { sport, championship } = useLocalSearchParams<{
    sport: Sport;
    championship?: string;
  }>();
  const { matches, loading, error, refetch } = useTodayMatches(sport as Sport);

  const title = championship ? getChampionshipLabel(championship) : 'Todos';

  const filteredMatches = useMemo(() => {
    if (!championship) return matches;
    return matches.filter((m) => m.championship.slug === championship);
  }, [matches, championship]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title }} />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando jogos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title }} />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={refetch}>
          Tentar novamente
        </Text>
      </View>
    );
  }

  if (filteredMatches.length === 0) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title }} />
        <Text style={styles.emptyText}>Nenhum jogo encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title }} />
      <FlatList
        data={filteredMatches}
        keyExtractor={(item: Match) => item.id}
        renderItem={({ item }) => <MatchCard match={item} />}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    paddingVertical: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginHorizontal: 32,
  },
  retryText: {
    marginTop: 12,
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
