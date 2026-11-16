import { useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../components/AdBanner';
import { FavoritePill } from '../components/FavoritePill';
import { MatchCard } from '../components/MatchCard';
import { MatchRow } from '../components/MatchRow';
import { WatchSheet } from '../components/WatchSheet';
import { SegmentedChips } from '../components/SegmentedChips';
import { useCompetition } from '../contexts/CompetitionContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useSync } from '../contexts/SyncContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  sortForDisplay,
  useDayMatches,
  useNextMatches,
  useTeamsById,
} from '../hooks/useSuperliga';
import { CompetitionSlug, Match } from '../types/snapshot';
import {
  addDays,
  formatDay,
  formatRelativeSync,
  getDayBounds,
} from '../utils/date';
import { COMPETITION_OPTIONS, getCompetition } from '../constants/competitions';
import { radius, spacing, typography } from '../constants/designTokens';

type DayOption = '-1' | '0' | '1';

const DAY_OPTIONS: { value: DayOption; label: string }[] = [
  { value: '-1', label: 'Ontem' },
  { value: '0', label: 'Hoje' },
  { value: '1', label: 'Amanhã' },
];

const COMPETITION_FILTERS: {
  value: 'todos' | CompetitionSlug;
  label: string;
}[] = [{ value: 'todos', label: 'Todos' }, ...COMPETITION_OPTIONS];

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { lastSyncAt, refreshing, refreshFailed, refresh } = useSync();
  const { favorites, isFavorite } = useFavorites();
  const teamsById = useTeamsById();
  const [dayOption, setDayOption] = useState<DayOption>('0');
  const { filter, setFilter } = useCompetition();
  // Match whose "where to watch" sheet is open; null keeps it closed.
  const [selected, setSelected] = useState<Match | null>(null);

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

  // The favorite of the selected competition, else the first one chosen.
  const favoriteTeamId = competition
    ? favorites[competition]
    : Object.values(favorites)[0];
  const favoriteTeam = favoriteTeamId
    ? teamsById.get(favoriteTeamId)
    : undefined;

  const renderMatch = (match: Match) => {
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
        onPress={() => setSelected(match)}
      />
    );
  };

  // Matches on other days are a compact list: the day's games get the cards.
  const renderNextMatch = (match: Match) => {
    const homeTeam = teamsById.get(match.homeTeamId);
    const awayTeam = teamsById.get(match.awayTeamId);
    if (!homeTeam || !awayTeam) return null;

    return (
      <MatchRow
        key={match.id}
        match={match}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        favorite={isFavorite(match.homeTeamId) || isFavorite(match.awayTeamId)}
        onPress={() => setSelected(match)}
      />
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text
            numberOfLines={1}
            style={[styles.title, { color: colors.textPrimary }]}
          >
            {competition ? getCompetition(competition).name : 'Jogos'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {refreshFailed
              ? 'Sem conexão: mostrando dados salvos'
              : lastSyncAt !== null
                ? formatRelativeSync(lastSyncAt, Date.now())
                : ''}
          </Text>
        </View>
        <FavoritePill
          team={favoriteTeam}
          onPress={() => router.push('/configuracoes')}
        />
      </View>

      <SegmentedChips
        options={DAY_OPTIONS}
        selected={dayOption}
        onSelect={setDayOption}
      />
      <SegmentedChips
        options={COMPETITION_FILTERS}
        selected={filter}
        onSelect={setFilter}
        scrollable
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

        {matches.map(renderMatch)}

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
            <View
              style={[styles.nextList, { backgroundColor: colors.surface }]}
            >
              {(nextMatches ?? []).map(renderNextMatch)}
            </View>
          </>
        )}

        <AdBanner />
      </ScrollView>

      <WatchSheet
        match={selected}
        homeTeam={selected ? teamsById.get(selected.homeTeamId) : undefined}
        awayTeam={selected ? teamsById.get(selected.awayTeamId) : undefined}
        onClose={() => setSelected(null)}
        onDetails={(match) => {
          setSelected(null);
          router.push(`/match/${match.id}`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.title + 4,
    fontWeight: typography.weight.heavy,
    letterSpacing: -0.5,
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
  nextList: {
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  empty: {
    fontSize: typography.size.body,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
});
