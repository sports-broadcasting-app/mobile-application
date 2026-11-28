import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SearchField } from '@/shared/ui/SearchField';
import { SegmentedChips } from '@/shared/ui/SegmentedChips';
import { TeamCircle } from '@/entities/team/ui/TeamCircle';
import { TransferCard } from './TransferCard';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { useFavorites } from '@/entities/team/model/FavoritesContext';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useTeams, useTeamsById, useTransfers } from '@/shared/api/queries';
import { CompetitionSlug, Team, Transfer } from '@/shared/api/snapshot';
import {
  filterTransfers,
  findTeams,
  getFavoriteDirection,
  splitByFavorite,
  splitByTeam,
} from '../lib/transfers';
import { getTeamName } from '@/shared/lib/teamName';
import { iconSize, radius, spacing } from '@/shared/theme/designTokens';

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
  // Virtualized: the curated list grows all season long.
  const listSections = sections
    .filter(([, items]) => items.length > 0)
    .map(([title, data]) => ({ title, data }));

  // An element, not a component: a component defined here would remount on
  // every keystroke and close the keyboard.
  const listHeader = (
    <>
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
          <AppText
            variant="bodyStrong"
            numberOfLines={1}
            style={styles.teamName}
          >
            {getTeamName(selectedTeam.name)}
          </AppText>
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
          <SectionHeader title="Times" />
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
              <AppText
                variant="bodyStrong"
                numberOfLines={1}
                style={styles.teamName}
              >
                {getTeamName(team.name)}
              </AppText>
              <MaterialCommunityIcons
                name="chevron-right"
                size={iconSize.md}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </>
      )}
    </>
  );

  return (
    <SectionList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      stickySectionHeadersEnabled={false}
      sections={listSections}
      keyExtractor={(transfer) => transfer.id}
      ListHeaderComponent={listHeader}
      renderSectionHeader={({ section }) => (
        <SectionHeader
          title={section.title}
          detail={String(section.data.length)}
          testID={`transfers-section-${section.title}`}
        />
      )}
      renderItem={({ item }) => (
        <TransferCard
          transfer={item}
          teamsById={teamsById}
          favoriteDirection={getFavoriteDirection(item, favoriteTeamId)}
        />
      )}
      ListEmptyComponent={
        isEmpty ? (
          <AppText variant="body" tone="secondary" style={styles.empty}>
            {query || selectedTeam
              ? 'Nenhuma transferência encontrada'
              : 'Nenhuma transferência registrada nesta temporada'}
          </AppText>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
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
  },
  empty: {
    paddingVertical: spacing.xxl,
    textAlign: 'center',
  },
});
