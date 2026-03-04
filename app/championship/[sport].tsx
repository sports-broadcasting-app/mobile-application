import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTodayMatches } from '../../src/hooks/useTodayMatches';
import { getChampionshipLabel } from '../../src/utils/championshipLabel';
import { Sport } from '../../src/types/match';

export default function ChampionshipScreen() {
  const { sport } = useLocalSearchParams<{ sport: Sport }>();
  const router = useRouter();
  const { championships, loading, error, refetch } = useTodayMatches(
    sport as Sport,
  );

  const title = sport === 'football' ? 'Futebol' : 'Volei';

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title }} />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando campeonatos...</Text>
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

  const items = [
    { slug: undefined as string | undefined, label: 'Todos os campeonatos' },
    ...championships.map((slug) => ({
      slug,
      label: getChampionshipLabel(slug),
    })),
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title }} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.slug ?? 'all'}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            testID={`championship-card-${item.slug ?? 'all'}`}
            onPress={() =>
              router.push({
                pathname: '/matches/[sport]',
                params: {
                  sport: sport as string,
                  ...(item.slug && { championship: item.slug }),
                },
              })
            }
          >
            <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        )}
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
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
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
});
