import { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../components/AdBanner';
import { SegmentedChips } from '../components/SegmentedChips';
import { StandingsList } from '../components/StandingsList';
import { useFavorites } from '../contexts/FavoritesContext';
import { useSync } from '../contexts/SyncContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  useHasTransfers,
  useStandings,
  useTeamsById,
} from '../hooks/useSuperliga';
import { CompetitionSlug } from '../types/superliga';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

const OPTIONS: { value: CompetitionSlug; label: string }[] = [
  { value: 'masculina', label: 'Masculina' },
  { value: 'feminina', label: 'Feminina' },
];

const LEGEND = [
  { code: 'P', label: 'Pontos' },
  { code: 'J', label: 'Jogos' },
  { code: 'V', label: 'Vitórias' },
  { code: 'D', label: 'Derrotas' },
  { code: 'SV', label: 'Sets vencidos' },
  { code: 'SP', label: 'Sets perdidos' },
];

export default function StandingsScreen() {
  const { colors } = useTheme();
  const { refreshing, refresh } = useSync();
  const { isFavorite } = useFavorites();
  const teamsById = useTeamsById();
  const [competition, setCompetition] = useState<CompetitionSlug>('masculina');
  const { data: standings } = useStandings(competition);
  const hasTransfers = useHasTransfers();
  const router = useRouter();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Classificação
        </Text>
      </View>
      <SegmentedChips
        options={OPTIONS}
        selected={competition}
        onSelect={setCompetition}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        {hasTransfers && (
          <TouchableOpacity
            accessibilityRole="button"
            testID="open-transfers"
            style={[styles.transfers, { backgroundColor: colors.surface }]}
            onPress={() =>
              router.push({
                pathname: '/transferencias',
                params: { competition },
              })
            }
          >
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={iconSize.md}
              color={colors.primary}
            />
            <Text style={[styles.transfersText, { color: colors.textPrimary }]}>
              Transferências da temporada
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={iconSize.md}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
        <StandingsList
          standings={standings ?? []}
          teamsById={teamsById}
          isFavorite={isFavorite}
        />
        <View style={styles.legend} testID="standings-legend">
          {LEGEND.map(({ code, label }) => (
            <Text
              key={code}
              style={[styles.legendItem, { color: colors.textTertiary }]}
            >
              <Text
                style={[styles.legendCode, { color: colors.textSecondary }]}
              >
                {code}
              </Text>
              {`  ${label}`}
            </Text>
          ))}
        </View>
        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  transfers: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
  },
  transfersText: {
    flex: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    rowGap: spacing.sm,
  },
  legendItem: {
    width: '50%',
    fontSize: typography.size.sm,
  },
  legendCode: {
    fontWeight: typography.weight.bold,
  },
});
