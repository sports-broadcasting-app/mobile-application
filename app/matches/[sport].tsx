import { useMemo } from 'react';
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
import { useTodayMatches } from '../../src/hooks/useTodayMatches';
import { MatchCard } from '../../src/components/MatchCard';
import { getChampionshipLabel } from '../../src/utils/championshipLabel';
import { formatShortDate } from '../../src/utils/dateFormat';
import { Match, Sport } from '../../src/types/match';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function MatchesScreen() {
  const { sport, championship } = useLocalSearchParams<{
    sport: Sport;
    championship?: string;
  }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { matches, date, loading, error, refetch } = useTodayMatches(
    sport as Sport,
  );

  const title = championship ? getChampionshipLabel(championship) : 'Todos';

  const filteredMatches = useMemo(() => {
    if (!championship) return matches;
    return matches.filter((m) => m.championship.slug === championship);
  }, [matches, championship]);

  const headerRight = () => (
    <TouchableOpacity
      onPress={() => Alert.alert('Tabela', 'Em breve')}
      testID="tabela-button"
    >
      <Text style={[styles.headerAction, { color: colors.primary }]}>
        Tabela
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title, headerRight }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Carregando jogos...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title, headerRight }} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <Text
          style={[styles.retryText, { color: colors.primary }]}
          onPress={refetch}
        >
          Tentar novamente
        </Text>
      </View>
    );
  }

  if (filteredMatches.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title, headerRight }} />
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          Nenhum jogo encontrado
        </Text>
      </View>
    );
  }

  const shortDate = date ? formatShortDate(date) : '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title, headerRight }} />
      <FlatList
        data={filteredMatches}
        keyExtractor={(item: Match) => item.id}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            onPress={() =>
              router.push({
                pathname: '/match/[id]',
                params: { id: item.id, sport: item.sport },
              })
            }
          />
        )}
        ListHeaderComponent={
          shortDate ? (
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
              {shortDate}
            </Text>
          ) : null
        }
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
  },
  list: {
    paddingBottom: 16,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
  },
  retryText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
  },
});
