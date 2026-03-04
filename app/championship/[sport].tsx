import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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

  const headerRight = () => (
    <TouchableOpacity
      onPress={() => Alert.alert('Configuracoes', 'Em breve')}
      testID="championship-settings"
    >
      <MaterialCommunityIcons name="cog" size={24} color="#2563eb" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title, headerRight }} />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando campeonatos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title, headerRight }} />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={refetch}>
          Tentar novamente
        </Text>
      </View>
    );
  }

  const items = championships.map((slug) => ({
    slug,
    label: getChampionshipLabel(slug),
  }));

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title, headerRight }} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            testID={`championship-card-${item.slug}`}
            onPress={() =>
              router.push({
                pathname: '/matches/[sport]',
                params: {
                  sport: sport as string,
                  championship: item.slug,
                },
              })
            }
          >
            <Text style={styles.rowText}>{item.label}</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#ccc"
            />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
