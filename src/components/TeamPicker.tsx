import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SearchField } from './SearchField';
import { SegmentedChips } from './SegmentedChips';
import { TeamCircle } from './TeamCircle';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTeams } from '../hooks/useSuperliga';
import { CompetitionSlug } from '../types/snapshot';
import { normalizeForSearch } from '../utils/search';
import { getTeamName, teamSearchText } from '../utils/teamName';
import { COMPETITION_OPTIONS } from '../constants/competitions';
import { iconSize, spacing, typography } from '../constants/designTokens';

/**
 * Competition chips, a search and the teams of the chosen competition; a tap
 * makes a team the favorite of its competition. Meant to sit in a ScrollView.
 */
export function TeamPicker() {
  const { colors } = useTheme();
  const { favorites, toggleFavorite } = useFavorites();
  const [competition, setCompetition] = useState<CompetitionSlug>('masculina');
  const [query, setQuery] = useState('');
  const { data: teams } = useTeams(competition);

  const visibleTeams = useMemo(() => {
    const term = normalizeForSearch(query);
    return (teams ?? [])
      .filter(
        (team) =>
          !term ||
          normalizeForSearch(teamSearchText(team.name, team.code)).includes(
            term,
          ),
      )
      .sort((a, b) => getTeamName(a.name).localeCompare(getTeamName(b.name)));
  }, [teams, query]);

  return (
    <View>
      <SegmentedChips
        options={COMPETITION_OPTIONS}
        selected={competition}
        onSelect={setCompetition}
        scrollable
      />

      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar time"
        testID="team-search"
      />

      {visibleTeams.map((team) => {
        const selected = favorites[competition] === team.id;
        return (
          <TouchableOpacity
            key={team.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            testID={`team-option-${team.id}`}
            style={[styles.row, { borderBottomColor: colors.borderLight }]}
            onPress={() => toggleFavorite(competition, team.id)}
          >
            <TeamCircle team={team} size={36} />
            <Text
              numberOfLines={1}
              style={[styles.teamName, { color: colors.textPrimary }]}
            >
              {getTeamName(team.name)}
            </Text>
            <MaterialCommunityIcons
              name={selected ? 'star' : 'star-outline'}
              size={iconSize.lg}
              color={selected ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        );
      })}

      {teams !== undefined && visibleTeams.length === 0 && (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          Nenhum time encontrado
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  teamName: {
    flex: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  empty: {
    fontSize: typography.size.body,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
});
