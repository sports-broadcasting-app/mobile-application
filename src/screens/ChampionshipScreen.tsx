import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTodayMatches } from '../hooks/useTodayMatches';
import { getChampionshipLabel } from '../utils/championshipLabel';
import { SkeletonBlock } from '../components/SkeletonBlock';
import { Sport } from '../types/match';
import { useTheme } from '../contexts/ThemeContext';

interface ChampionshipScreenProps {
  sport: Sport;
  onPressChampionship: (slug: string) => void;
}

export function ChampionshipScreen({
  sport,
  onPressChampionship,
}: ChampionshipScreenProps) {
  const { colors, toggleTheme } = useTheme();
  const { championships, loading, error, refetch } = useTodayMatches(sport);

  const SPORT_TITLES: Record<Sport, string> = {
    football: 'Futebol',
    volleyball: 'Volei',
    formula1: 'Formula 1',
  };
  const title = SPORT_TITLES[sport];

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
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Stack.Screen options={{ title, headerRight }} />
        <ScrollView
          testID="skeleton-loading"
          contentContainerStyle={styles.list}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i}>
              <View style={styles.skeletonRow}>
                <SkeletonBlock
                  width={160 - i * 10}
                  height={16}
                  borderRadius={4}
                />
                <SkeletonBlock width={22} height={22} borderRadius={4} />
              </View>
              {i < 5 && (
                <View
                  style={[
                    styles.separator,
                    { backgroundColor: colors.borderLight },
                  ]}
                />
              )}
            </View>
          ))}
        </ScrollView>
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
            onPress={() => onPressChampionship(item.slug)}
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
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
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
