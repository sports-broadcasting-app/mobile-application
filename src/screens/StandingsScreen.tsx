import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { Sport, StandingsTable as StandingsTableType } from '../types/match';
import { useStandings } from '../hooks/useStandings';
import { StandingsCard } from '../components/StandingsCard';
import { F1StandingsCard } from '../components/F1StandingsCard';
import { SearchBar } from '../components/SearchBar';
import { SkeletonBlock } from '../components/SkeletonBlock';
import { useTheme } from '../contexts/ThemeContext';
import { getChampionshipLabel } from '../utils/championshipLabel';
import {
  spacing,
  radius,
  typography,
  iconSize,
} from '../constants/designTokens';

const SPORT_FILTERS: { value: Sport; label: string }[] = [
  { value: 'football', label: 'Futebol' },
  { value: 'volleyball', label: 'Volei' },
  { value: 'formula1', label: 'F1' },
];

export default function StandingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [sportFilter, setSportFilter] = useState<Sport>('football');
  const [searchQuery, setSearchQuery] = useState('');
  const { tables, loading, error, refetch } = useStandings(
    undefined,
    sportFilter,
  );

  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables;
    const query = searchQuery.toLowerCase().trim();
    return tables.filter((table) => {
      const label = getChampionshipLabel(table.championship).toLowerCase();
      return label.includes(query);
    });
  }, [tables, searchQuery]);

  const handleSportChange = useCallback((sport: Sport) => {
    setSportFilter(sport);
    setSearchQuery('');
  }, []);

  const handleCardPress = useCallback(
    (table: StandingsTableType) => {
      router.push({
        pathname: '/standings/[championship]',
        params: {
          championship: table.championship,
          sport: table.sport,
        },
      });
    },
    [router],
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
        Classificacoes
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {SPORT_FILTERS.map(({ value, label }) => {
          const isActive = sportFilter === value;
          return (
            <TouchableOpacity
              key={label}
              style={[
                styles.chip,
                isActive
                  ? { backgroundColor: colors.chipActiveBg }
                  : {
                      backgroundColor: colors.chipInactiveBg,
                      borderColor: colors.chipBorder,
                      borderWidth: 1,
                    },
              ]}
              onPress={() => handleSportChange(value)}
              testID={`standings-chip-${label.toLowerCase()}`}
            >
              <Text
                style={[
                  styles.chipLabel,
                  {
                    color: isActive
                      ? colors.chipActiveText
                      : colors.chipInactiveText,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar campeonato..."
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colors.statusBar} />
        {renderHeader()}
        <ScrollView
          testID="skeleton-loading"
          contentContainerStyle={styles.skeletonContainer}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.skeletonCard,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <View style={styles.skeletonHeader}>
                <SkeletonBlock width={20} height={20} borderRadius={4} />
                <SkeletonBlock width={160} height={16} borderRadius={4} />
              </View>
              {Array.from({ length: 3 }).map((__, j) => (
                <View key={j} style={styles.skeletonRow}>
                  <SkeletonBlock width={20} height={14} borderRadius={4} />
                  <SkeletonBlock width={20} height={20} borderRadius={10} />
                  <SkeletonBlock
                    width={100 - j * 10}
                    height={14}
                    borderRadius={4}
                  />
                  <View style={styles.skeletonRowRight}>
                    <SkeletonBlock width={28} height={14} borderRadius={4} />
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colors.statusBar} />
        {renderHeader()}
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <Text
            style={[styles.retryText, { color: colors.primary }]}
            onPress={() => refetch()}
          >
            Tentar novamente
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBar} />
      {renderHeader()}
      <FlatList
        data={filteredTables}
        keyExtractor={(t) => `${t.championship}-${t.group ?? ''}-${t.type}`}
        renderItem={({ item }) =>
          item.sport === 'formula1' ? (
            <F1StandingsCard
              table={item}
              onPress={() => handleCardPress(item)}
            />
          ) : (
            <StandingsCard table={item} onPress={() => handleCardPress(item)} />
          )
        }
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={loading}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={styles.centered}>
            <MaterialCommunityIcons
              name="trophy-outline"
              size={iconSize.xl}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Nenhuma classificacao disponivel
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 56,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  searchContainer: {
    marginTop: spacing.md,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: spacing.md,
  },
  errorText: {
    fontSize: typography.size.md,
    textAlign: 'center',
    marginHorizontal: spacing.xxxl,
  },
  retryText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  emptyText: {
    fontSize: typography.size.md,
  },
  skeletonContainer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  skeletonCard: {
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  skeletonRowRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
