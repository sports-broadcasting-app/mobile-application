import {
  ActivityIndicator,
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
import { useTheme } from '../../src/contexts/ThemeContext';

export default function ChampionshipScreen() {
  const { sport } = useLocalSearchParams<{ sport: Sport }>();
  const router = useRouter();
  const { colors, toggleTheme } = useTheme();
  const { championships, loading, error, refetch } = useTodayMatches(
    sport as Sport,
  );

  const title = sport === 'football' ? 'Futebol' : 'Volei';

  const headerRight = () => (
    <TouchableOpacity onPress={toggleTheme} testID="championship-settings">
      <MaterialCommunityIcons
        name="theme-light-dark"
        size={24}
        color={colors.primary}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.surface }]}>
        <Stack.Screen options={{ title, headerRight }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Carregando campeonatos...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.surface }]}>
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

  const items = championships.map((slug) => ({
    slug,
    label: getChampionshipLabel(slug),
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
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
            <Text style={[styles.rowText, { color: colors.textPrimary }]}>
              {item.label}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => (
          <View
            style={[styles.separator, { backgroundColor: colors.borderLight }]}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  separator: {
    height: 1,
    marginHorizontal: 20,
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
});
