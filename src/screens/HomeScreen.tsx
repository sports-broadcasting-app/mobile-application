import { useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Sport, Match } from '../types/match';
import { useTodayMatches } from '../hooks/useTodayMatches';
import { useRecentMatches } from '../hooks/useRecentMatches';
import { useFilters } from '../contexts/FilterContext';
import { getChampionshipLabel } from '../utils/championshipLabel';
import { SPORTS } from '../constants/sports';
import { MatchCard } from '../components/MatchCard';
import { SearchBar } from '../components/SearchBar';
import { SearchPanel } from '../components/SearchPanel';
import { GradientHeader } from '../components/GradientHeader';
import { useTheme } from '../contexts/ThemeContext';

interface HomeScreenProps {
  onPressMatch: (match: Match) => void;
}

export function HomeScreen({ onPressMatch }: HomeScreenProps) {
  const { colors } = useTheme();
  const { highlightedMatches, loading, error, refetch } = useTodayMatches();
  const { recentIds, addRecent, clearRecents } = useRecentMatches();
  const { filters } = useFilters();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredMatches = useMemo(() => {
    let matches = highlightedMatches;

    if (selectedSport) {
      matches = matches.filter((m) => m.sport === selectedSport);
    }

    if (filters.sports.length > 0) {
      matches = matches.filter((m) => filters.sports.includes(m.sport));
    }
    if (filters.championships.length > 0) {
      matches = matches.filter((m) =>
        filters.championships.includes(m.championship.slug),
      );
    }
    if (filters.broadcasters.length > 0) {
      matches = matches.filter((m) =>
        m.broadcast.some((b) => filters.broadcasters.includes(b.name)),
      );
    }

    if (!searchQuery.trim()) return matches;
    const q = searchQuery.toLowerCase();
    return matches.filter((m) => {
      if (m.sport === 'formula1') {
        return (
          m.eventName.toLowerCase().includes(q) ||
          m.sessionLabel.toLowerCase().includes(q) ||
          getChampionshipLabel(m.championship.slug).toLowerCase().includes(q)
        );
      }
      return (
        m.homeTeam.name.toLowerCase().includes(q) ||
        m.awayTeam.name.toLowerCase().includes(q) ||
        getChampionshipLabel(m.championship.slug).toLowerCase().includes(q)
      );
    });
  }, [highlightedMatches, searchQuery, selectedSport, filters]);

  const recentMatches = useMemo(() => {
    const ids = recentIds.map((r) => r.id);
    return ids
      .map((id) => highlightedMatches.find((m) => m.id === id))
      .filter((m): m is Match => m !== undefined);
  }, [recentIds, highlightedMatches]);

  const suggestedMatches = useMemo(() => {
    const liveMatches = highlightedMatches.filter(
      (m) => m.status === 'match-live',
    );
    const upcomingMatches = highlightedMatches
      .filter((m) => m.status === 'match-not-started')
      .slice(0, 5);
    return [...liveMatches, ...upcomingMatches].slice(0, 8);
  }, [highlightedMatches]);

  const handlePressMatch = useCallback(
    (match: Match) => {
      addRecent(match);
      onPressMatch(match);
    },
    [addRecent, onPressMatch],
  );

  const handleSportPress = (sport: Sport) => {
    setSelectedSport((prev) => (prev === sport ? null : sport));
  };

  const handleSearchPanelMatch = useCallback(
    (match: Match) => {
      setIsSearchFocused(false);
      setSearchQuery('');
      handlePressMatch(match);
    },
    [handlePressMatch],
  );

  const renderHeader = () => (
    <View>
      <GradientHeader>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {SPORTS.map(({ sport, label, icon, enabled }) => {
            const isActive = selectedSport === sport;
            return (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.chip,
                  isActive
                    ? { backgroundColor: colors.chipActiveBg }
                    : {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderColor: 'rgba(255,255,255,0.3)',
                        borderWidth: 1,
                      },
                  !enabled && { opacity: 0.4 },
                ]}
                activeOpacity={0.7}
                onPress={() => enabled && handleSportPress(sport)}
                disabled={!enabled}
                testID={`sport-chip-${sport}`}
              >
                <MaterialCommunityIcons
                  name={icon}
                  size={18}
                  color={isActive ? colors.chipActiveText : '#fff'}
                />
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: isActive ? colors.chipActiveText : '#fff',
                    },
                  ]}
                >
                  {enabled ? label : `${label} (Em breve)`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </GradientHeader>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar time, evento ou liga..."
          onFocus={() => setIsSearchFocused(true)}
        />
      </View>

      {isSearchFocused ? (
        <SearchPanel
          recentMatches={recentMatches}
          suggestedMatches={suggestedMatches}
          onPressMatch={handleSearchPanelMatch}
          onClearRecents={clearRecents}
        />
      ) : (
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Jogos do Dia
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
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
        <StatusBar style="light" />
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
      <StatusBar style="light" />
      <FlatList
        data={isSearchFocused ? [] : filteredMatches}
        keyExtractor={(item: Match) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <MatchCard match={item} onPress={() => handlePressMatch(item)} />
        )}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={loading}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          isSearchFocused ? null : (
            <View style={styles.centered}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                Nenhum jogo encontrado
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
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
