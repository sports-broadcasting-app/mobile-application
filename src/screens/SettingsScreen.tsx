import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppearancePicker } from '../components/AppearancePicker';
import { SearchField } from '../components/SearchField';
import { SegmentedChips } from '../components/SegmentedChips';
import { TeamCircle } from '../components/TeamCircle';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTeams } from '../hooks/useSuperliga';
import { CompetitionSlug } from '../types/superliga';
import { normalizeForSearch } from '../utils/search';
import { getTeamName, teamSearchText } from '../utils/teamName';
import { iconSize, spacing, typography } from '../constants/designTokens';

const COMPETITION_OPTIONS: { value: CompetitionSlug; label: string }[] = [
  { value: 'masculina', label: 'Masculina' },
  { value: 'feminina', label: 'Feminina' },
];

export default function SettingsScreen() {
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
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Configurações
          </Text>
        </View>

        <Text
          style={[styles.sectionTitle, { color: colors.sectionHeaderText }]}
        >
          Aparência
        </Text>
        <AppearancePicker />

        <Text
          style={[styles.sectionTitle, { color: colors.sectionHeaderText }]}
        >
          Time favorito
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Escolha um time por competição
        </Text>
        <SegmentedChips
          options={COMPETITION_OPTIONS}
          selected={competition}
          onSelect={setCompetition}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: typography.size.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
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
