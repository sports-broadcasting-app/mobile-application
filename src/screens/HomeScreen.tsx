import { useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../components/AdBanner';
import { MatchCard } from '../components/MatchCard';
import { SegmentedChips } from '../components/SegmentedChips';
import { useFavorites } from '../contexts/FavoritesContext';
import { useSync } from '../contexts/SyncContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  sortForDisplay,
  useDayMatches,
  useNextMatches,
  useTeamsById,
} from '../hooks/useSuperliga';
import { CompetitionSlug, Match } from '../types/superliga';
import {
  addDays,
  formatDay,
  formatRelativeSync,
  getDayBounds,
} from '../utils/date';
import { spacing, typography } from '../constants/designTokens';

type DayOption = '-1' | '0' | '1';
type CompetitionFilter = 'todos' | CompetitionSlug;

const DAY_OPTIONS: { value: DayOption; label: string }[] = [
  { value: '-1', label: 'Ontem' },
  { value: '0', label: 'Hoje' },
  { value: '1', label: 'Amanhã' },
];

const COMPETITION_OPTIONS: { value: CompetitionFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'masculina', label: 'Masculina' },
  { value: 'feminina', label: 'Feminina' },
];

const COMPETITION_TITLES: Record<CompetitionSlug, string> = {
  masculina: 'Masculina',
  feminina: 'Feminina',
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { lastSyncAt, refreshing, refreshFailed, refresh } = useSync();
  const { favorites, isFavorite } = useFavorites();
  const teamsById = useTeamsById();
  const [dayOption, setDayOption] = useState<DayOption>('0');
  const [filter, setFilter] = useState<CompetitionFilter>('todos');

  const day = addDays(new Date(), Number(dayOption));
  const competition = filter === 'todos' ? undefined : filter;
  const { data: dayMatches } = useDayMatches(day);

  const matches = useMemo(
    () =>
      sortForDisplay(
        (dayMatches ?? []).filter(
          (match) => !competition || match.competition === competition,
        ),
        isFavorite,
      ),
    [dayMatches, competition, isFavorite],
  );

  const isEmpty = dayMatches !== undefined && matches.length === 0;
  const { data: nextMatches } = useNextMatches(
    getDayBounds(day).end,
    competition,
    isEmpty,
  );

  const renderMatch = (match: Match, showDate: boolean) => {
    const homeTeam = teamsById.get(match.homeTeamId);
    const awayTeam = teamsById.get(match.awayTeamId);
    if (!homeTeam || !awayTeam) return null;

    return (
      <MatchCard
        key={match.id}
        match={match}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        favorite={isFavorite(match.homeTeamId) || isFavorite(match.awayTeamId)}
        showDate={showDate}
        onPress={() => router.push(`/match/${match.id}`)}
      />
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {competition
            ? `Superliga ${COMPETITION_TITLES[competition]}`
            : 'Superliga'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {refreshFailed
            ? 'Sem conexão: mostrando dados salvos'
            : lastSyncAt !== null
              ? formatRelativeSync(lastSyncAt, Date.now())
              : ''}
        </Text>
      </View>

      <SegmentedChips
        options={DAY_OPTIONS}
        selected={dayOption}
        onSelect={setDayOption}
      />
      <SegmentedChips
        options={COMPETITION_OPTIONS}
        selected={filter}
        onSelect={setFilter}
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
        <Text style={[styles.dayLabel, { color: colors.sectionHeaderText }]}>
          {formatDay(day)}
        </Text>

        {Object.keys(favorites).length === 0 && (
          <TouchableOpacity onPress={() => router.push('/configuracoes')}>
            <Text style={[styles.hint, { color: colors.primary }]}>
              Escolha seu time favorito em cada competição
            </Text>
          </TouchableOpacity>
        )}

        {matches.map((match) => renderMatch(match, false))}

        {isEmpty && (
          <>
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              Nenhum jogo neste dia
            </Text>
            {(nextMatches ?? []).length > 0 && (
              <Text
                style={[styles.dayLabel, { color: colors.sectionHeaderText }]}
              >
                Próximos jogos
              </Text>
            )}
            {(nextMatches ?? []).map((match) => renderMatch(match, true))}
          </>
        )}

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
  subtitle: {
    fontSize: typography.size.sm,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  dayLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  hint: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  empty: {
    fontSize: typography.size.body,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
});
