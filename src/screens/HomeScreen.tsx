import { useState, useMemo } from 'react';
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
import { SPORTS } from '../constants/sports';
import { MatchCard } from '../components/MatchCard';
import { GradientHeader } from '../components/GradientHeader';
import { useTheme } from '../contexts/ThemeContext';

interface HomeScreenProps {
  onPressMatch: (match: Match) => void;
}

export function HomeScreen({ onPressMatch }: HomeScreenProps) {
  const { colors } = useTheme();
  const { highlightedMatches, loading, error, refetch } = useTodayMatches();
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);

  const filteredMatches = useMemo(() => {
    if (!selectedSport) return highlightedMatches;
    return highlightedMatches.filter((m) => m.sport === selectedSport);
  }, [highlightedMatches, selectedSport]);

  const handleSportPress = (sport: Sport) => {
    setSelectedSport((prev) => (prev === sport ? null : sport));
  };

  const renderHeader = () => (
    <View>
      <GradientHeader>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {SPORTS.map(({ sport, label, icon }) => {
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
                ]}
                activeOpacity={0.7}
                onPress={() => handleSportPress(sport)}
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
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </GradientHeader>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Jogos do Dia
      </Text>
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
        data={filteredMatches}
        keyExtractor={(item: Match) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <MatchCard match={item} onPress={() => onPressMatch(item)} />
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
