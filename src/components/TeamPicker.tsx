import { useMemo } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { Team, Sport } from '../types/match';
import { fetchTeams, League } from '../services/matchService';
import { getChampionshipLabel } from '../utils/championshipLabel';
import { TeamCircle } from './TeamCircle';
import { useTheme } from '../contexts/ThemeContext';

interface TeamItem {
  team: Team;
  sport: Sport;
}

interface TeamSection {
  title: string;
  sport: Sport;
  data: TeamItem[];
}

interface TeamPickerProps {
  onToggleTeam: (team: Team, sport: Sport) => void;
  selectedSlugs: Set<string>;
}

export function TeamPicker({ onToggleTeam, selectedSlugs }: TeamPickerProps) {
  const { colors } = useTheme();

  const {
    data: teamsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchTeams(),
  });

  const sections = useMemo((): TeamSection[] => {
    if (!teamsResponse?.leagues) return [];
    return teamsResponse.leagues.map((league: League) => ({
      title: getChampionshipLabel(league.championship),
      sport: league.sport,
      data: league.teams
        .map((team) => ({ team, sport: league.sport }))
        .sort((a, b) => a.team.name.localeCompare(b.team.name)),
    }));
  }, [teamsResponse]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Erro ao carregar times
        </Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          Nenhum time disponivel
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => `${item.sport}-${item.team.slug}`}
      scrollEnabled={false}
      renderSectionHeader={({ section }) => (
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => {
        const isSelected = selectedSlugs.has(item.team.slug);
        return (
          <TouchableOpacity
            style={[
              styles.row,
              {
                backgroundColor: isSelected
                  ? colors.surfaceAlt
                  : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onToggleTeam(item.team, item.sport)}
            testID={`team-option-${item.team.slug}`}
          >
            <View style={styles.rowLeft}>
              <TeamCircle team={item.team} size={32} />
              <Text
                style={[styles.teamName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {item.team.name}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={isSelected ? 'check-circle' : 'circle-outline'}
              size={22}
              color={isSelected ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  centered: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
  },
});
