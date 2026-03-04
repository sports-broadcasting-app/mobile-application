import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Sport, Match } from '../../src/types/match';
import { useTodayMatches } from '../../src/hooks/useTodayMatches';
import { getChampionshipLabel } from '../../src/utils/championshipLabel';
import { MatchCard } from '../../src/components/MatchCard';
import { SearchBar } from '../../src/components/SearchBar';
import { useTheme } from '../../src/contexts/ThemeContext';

const SPORTS: {
  sport: Sport;
  label: string;
  icon: 'soccer' | 'volleyball';
}[] = [
  { sport: 'football', label: 'Futebol', icon: 'soccer' },
  { sport: 'volleyball', label: 'Volei', icon: 'volleyball' },
];

export default function HomeTabScreen() {
  const router = useRouter();
  const { colors, toggleTheme } = useTheme();
  const { highlightedMatches, loading, error, refetch } = useTodayMatches();
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const filteredMatches = useMemo(() => {
    if (!searchQuery.trim()) return highlightedMatches;
    const q = searchQuery.toLowerCase();
    return highlightedMatches.filter(
      (m) =>
        m.homeTeam.name.toLowerCase().includes(q) ||
        m.awayTeam.name.toLowerCase().includes(q) ||
        getChampionshipLabel(m.championship.slug).toLowerCase().includes(q),
    );
  }, [highlightedMatches, searchQuery]);

  const renderHeader = () => (
    <View>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Onde Assistir
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formattedDate}
          </Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} testID="settings-button">
          <MaterialCommunityIcons
            name="theme-light-dark"
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View
        style={[styles.chipsContainer, { backgroundColor: colors.surface }]}
      >
        {SPORTS.map(({ sport, label, icon }) => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.chip,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.chipBorder,
              },
            ]}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/championship/[sport]',
                params: { sport },
              })
            }
            testID={`sport-card-${sport}`}
          >
            <MaterialCommunityIcons
              name={icon}
              size={40}
              color={colors.primary}
            />
            <Text style={[styles.chipLabel, { color: colors.textPrimary }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Em Destaque Hoje
      </Text>

      <View style={styles.searchContainer}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colors.statusBar} />
        {renderHeader()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Carregando jogos...
          </Text>
        </View>
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
            onPress={refetch}
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
      <FlatList
        data={filteredMatches}
        keyExtractor={(item: Match) => item.id}
        ListHeaderComponent={renderHeader}
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
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Nenhum jogo encontrado
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  chip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  list: {
    paddingBottom: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
