import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SearchField } from '../components/SearchField';
import { SegmentedChips } from '../components/SegmentedChips';
import { TeamCircle } from '../components/TeamCircle';
import { TransferCard } from '../components/TransferCard';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTeams, useTeamsById, useTransfers } from '../hooks/useSuperliga';
import { CompetitionSlug, Team, Transfer } from '../types/snapshot';
import {
  filterTransfers,
  findTeams,
  getFavoriteDirection,
  splitByFavorite,
  splitByTeam,
} from '../utils/transfers';
import { getTeamName } from '../utils/teamName';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

const OPTIONS: { value: CompetitionSlug; label: string }[] = [
  { value: 'masculina', label: 'Superliga M' },
  { value: 'feminina', label: 'Superliga F' },
];

const TEAM_SUGGESTIONS = 4;

export default function TransfersScreen() {
  const params = useLocalSearchParams<{ competition?: string }>();
  const { colors } = useTheme();
  const { favorites } = useFavorites();
  const teamsById = useTeamsById();
  const [competition, setCompetition] = useState<CompetitionSlug>(
    params.competition === 'feminina' ? 'feminina' : 'masculina',
  );
  const [query, setQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { data: transfers } = useTransfers(competition);
  const { data: teams } = useTeams(competition);

  const favoriteTeamId = favorites[competition];
  const filtered = useMemo(
    () => filterTransfers(transfers ?? [], query),
    [transfers, query],
  );
  const teamSuggestions = selectedTeam
    ? []
    : findTeams(teams ?? [], query).slice(0, TEAM_SUGGESTIONS);

  const changeCompetition = (next: CompetitionSlug) => {
    setCompetition(next);
    setSelectedTeam(null);
    setQuery('');
  };

  const selectTeam = (team: Team) => {
    setSelectedTeam(team);
    setQuery('');
  };

  const renderSection = (title: string, items: Transfer[]) =>
    items.length > 0 && (
      <>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {`${title} (${items.length})`}
        </Text>
        {items.map((transfer) => (
          <TransferCard
            key={transfer.id}
            transfer={transfer}
            teamsById={teamsById}
            favoriteDirection={getFavoriteDirection(transfer, favoriteTeamId)}
          />
        ))}
      </>
    );

  let sections: [string, Transfer[]][];
  if (selectedTeam) {
    const { arrivals, departures } = splitByTeam(filtered, selectedTeam.id);
    sections = [
      ['Chegaram', arrivals],
      ['Saíram', departures],
    ];
  } else {
    const { mine, others } = splitByFavorite(filtered, favoriteTeamId);
    sections = [
      ['Seu time', mine],
      [mine.length > 0 ? 'Demais times' : 'Todas', others],
    ];
  }
  const isEmpty =
    transfers !== undefined && sections.every(([, items]) => !items.length);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: 'Transferências' }} />
      <SegmentedChips
        options={OPTIONS}
        selected={competition}
        onSelect={changeCompetition}
      />
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder={
          selectedTeam ? 'Buscar atleta neste time' : 'Buscar atleta ou time'
        }
        testID="transfer-search"
      />

      {selectedTeam && (
        <View
          testID="selected-team"
          style={[styles.selected, { backgroundColor: colors.surface }]}
        >
          <TeamCircle team={selectedTeam} size={28} />
          <Text
            numberOfLines={1}
            style={[styles.teamName, { color: colors.textPrimary }]}
          >
            {getTeamName(selectedTeam.name)}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Mostrar todos os times"
            testID="clear-team"
            hitSlop={spacing.sm}
            onPress={() => setSelectedTeam(null)}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={iconSize.md}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      )}

      {teamSuggestions.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Times
          </Text>
          {teamSuggestions.map((team) => (
            <TouchableOpacity
              key={team.id}
              accessibilityRole="button"
              testID={`team-suggestion-${team.id}`}
              style={[
                styles.suggestion,
                { borderBottomColor: colors.borderLight },
              ]}
              onPress={() => selectTeam(team)}
            >
              <TeamCircle team={team} size={28} />
              <Text
                numberOfLines={1}
                style={[styles.teamName, { color: colors.textPrimary }]}
              >
                {getTeamName(team.name)}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={iconSize.md}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </>
      )}

      {sections.map(([title, items]) => (
        <View key={title}>{renderSection(title, items)}</View>
      ))}

      {isEmpty && (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          {query || selectedTeam
            ? 'Nenhuma transferência encontrada'
            : 'Nenhuma transferência registrada nesta temporada'}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    textTransform: 'uppercase',
  },
  selected: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  suggestion: {
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
    paddingVertical: spacing.xxl,
    textAlign: 'center',
  },
});
