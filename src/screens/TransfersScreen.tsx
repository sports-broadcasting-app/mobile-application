import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SearchField } from '../components/SearchField';
import { SegmentedChips } from '../components/SegmentedChips';
import { TransferCard } from '../components/TransferCard';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTeamsById, useTransfers } from '../hooks/useSuperliga';
import { CompetitionSlug, Transfer } from '../types/superliga';
import {
  filterTransfers,
  getFavoriteDirection,
  splitByFavorite,
} from '../utils/transfers';
import { spacing, typography } from '../constants/designTokens';

const OPTIONS: { value: CompetitionSlug; label: string }[] = [
  { value: 'masculina', label: 'Masculina' },
  { value: 'feminina', label: 'Feminina' },
];

export default function TransfersScreen() {
  const params = useLocalSearchParams<{ competition?: string }>();
  const { colors } = useTheme();
  const { favorites } = useFavorites();
  const teamsById = useTeamsById();
  const [competition, setCompetition] = useState<CompetitionSlug>(
    params.competition === 'feminina' ? 'feminina' : 'masculina',
  );
  const [query, setQuery] = useState('');
  const { data: transfers } = useTransfers(competition);

  const favoriteTeamId = favorites[competition];
  const { mine, others } = useMemo(
    () =>
      splitByFavorite(filterTransfers(transfers ?? [], query), favoriteTeamId),
    [transfers, query, favoriteTeamId],
  );

  const renderSection = (title: string, items: Transfer[]) =>
    items.length > 0 && (
      <>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {title}
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

  const isEmpty = transfers !== undefined && mine.length + others.length === 0;

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
        onSelect={setCompetition}
      />
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar atleta ou time"
        testID="transfer-search"
      />

      {renderSection('Seu time', mine)}
      {renderSection(mine.length > 0 ? 'Demais times' : 'Todas', others)}

      {isEmpty && (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          {query
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
  empty: {
    fontSize: typography.size.body,
    paddingVertical: spacing.xxl,
    textAlign: 'center',
  },
});
