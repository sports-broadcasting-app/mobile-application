import { useCallback, useMemo, useState } from 'react';
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
import { CompetitionsSheet } from '../components/CompetitionsSheet';
import { MatchCard } from '../components/MatchCard';
import { MatchRow } from '../components/MatchRow';
import { SectionHeader } from '../components/SectionHeader';
import { WatchSheet } from '../components/WatchSheet';
import { SegmentedChips } from '../components/SegmentedChips';
import {
  CompetitionFilter,
  useCompetition,
} from '../contexts/CompetitionContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useSync } from '../contexts/SyncContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  sortForDisplay,
  useDayMatches,
  useNextMatches,
  useTeamsById,
} from '../hooks/useSuperliga';
import { Match } from '../types/snapshot';
import {
  addDays,
  formatDay,
  formatRelativeSync,
  getDayBounds,
} from '../utils/date';
import { COMPETITION_OPTIONS, getCompetition } from '../constants/competitions';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

type DayOption = '-1' | '0' | '1';

const DAY_OPTIONS: { value: DayOption; label: string }[] = [
  { value: '-1', label: 'Ontem' },
  { value: '0', label: 'Hoje' },
  { value: '1', label: 'Amanhã' },
];

/** Below this many games a day looks empty: the next ones fill it. */
const FEW_MATCHES = 3;

interface Section {
  key: string;
  title: string;
  count?: number;
  favorite?: boolean;
  matches: Match[];
}

function plural(count: number): string {
  return count === 1 ? '1 jogo' : `${count} jogos`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { lastSyncAt, refreshing, refreshFailed, refresh } = useSync();
  const { favorites } = useFavorites();
  const teamsById = useTeamsById();
  const [dayOption, setDayOption] = useState<DayOption>('0');
  const { filter, setFilter, followed } = useCompetition();
  const [editing, setEditing] = useState(false);
  // Match whose "where to watch" sheet is open; null keeps it closed.
  const [selected, setSelected] = useState<Match | null>(null);

  const day = addDays(new Date(), Number(dayOption));
  const competition = filter === 'todos' ? undefined : filter;
  const scope = useMemo(
    () => (competition ? [competition] : followed),
    [competition, followed],
  );
  const { data: dayMatches } = useDayMatches(day);

  // A favorite counts in its own competition only.
  const isFavoriteMatch = useCallback(
    (match: Match) => {
      const teamId = favorites[match.competition];
      return teamId === match.homeTeamId || teamId === match.awayTeamId;
    },
    [favorites],
  );
  const isFavoriteTeam = useCallback(
    (teamId: string) => Object.values(favorites).includes(teamId),
    [favorites],
  );

  const matches = useMemo(
    () =>
      sortForDisplay(
        (dayMatches ?? []).filter((match) => scope.includes(match.competition)),
        isFavoriteTeam,
      ),
    [dayMatches, scope, isFavoriteTeam],
  );

  // "Todos": your teams first, then one section per competition.
  const sections = useMemo((): Section[] => {
    if (competition) return [{ key: 'all', title: '', matches }];
    const mine = matches.filter(isFavoriteMatch);
    const groups: Section[] = followed
      .map((slug) => {
        const list = matches.filter(
          (match) => match.competition === slug && !isFavoriteMatch(match),
        );
        return {
          key: slug,
          title: getCompetition(slug).name,
          count: list.length,
          matches: list,
        };
      })
      .filter((section) => section.matches.length > 0);
    return mine.length > 0
      ? [
          { key: 'mine', title: 'Seus times', favorite: true, matches: mine },
          ...groups,
        ]
      : groups;
  }, [competition, matches, followed, isFavoriteMatch]);

  const isEmpty = dayMatches !== undefined && matches.length === 0;
  const showNext = dayMatches !== undefined && matches.length < FEW_MATCHES;
  const { data: nextMatches } = useNextMatches(
    getDayBounds(day).end,
    scope,
    showNext,
  );

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
        favorite={isFavoriteMatch(match)}
        // Section headers and the title already name the competition,
        // except in "Seus times", which mixes them.
        showCompetition={
          !competition && sections.length > 0 && isFavoriteMatch(match)
        }
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
        favorite={isFavoriteMatch(match)}
        onPress={() => setSelected(match)}
      />
    );
  };

  const filters: { value: CompetitionFilter; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    ...COMPETITION_OPTIONS.filter((option) => followed.includes(option.value)),
  ];
  const nextTitle = competition
    ? `Próximos jogos · ${getCompetition(competition).label}`
    : 'Próximos jogos';

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
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

      <SegmentedChips
        options={DAY_OPTIONS}
        selected={dayOption}
        onSelect={setDayOption}
      />
      <SegmentedChips
        options={filters}
        selected={filter}
        onSelect={setFilter}
        scrollable
        trailing={
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Editar competições"
            testID="edit-competitions"
            hitSlop={{ top: 4, bottom: 4 }}
            style={[styles.editChip, { borderColor: colors.primary }]}
            onPress={() => setEditing(true)}
          >
            <MaterialCommunityIcons
              name="tune-variant"
              size={iconSize.sm}
              color={colors.primary}
            />
            <Text style={[styles.editText, { color: colors.primary }]}>
              Editar
            </Text>
          </TouchableOpacity>
        }
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
        <Text style={[styles.dayLabel, { color: colors.textPrimary }]}>
          {formatDay(day)}
        </Text>

        {sections.map((section) => (
          <View key={section.key}>
            {section.title !== '' && (
              <SectionHeader
                title={section.title}
                testID={`section-${section.key}`}
                style={styles.sectionHeader}
                icon={
                  section.favorite ? (
                    <MaterialCommunityIcons
                      name="star"
                      size={iconSize.sm}
                      color={colors.primary}
                    />
                  ) : undefined
                }
                detail={
                  section.count !== undefined
                    ? plural(section.count)
                    : undefined
                }
              />
            )}
            {section.matches.map(renderMatch)}
          </View>
        ))}

        {isEmpty && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Nenhum jogo neste dia
          </Text>
        )}
        {showNext && (nextMatches ?? []).length > 0 && (
          <>
            <SectionHeader title={nextTitle} style={styles.sectionHeader} />
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
      <CompetitionsSheet visible={editing} onClose={() => setEditing(false)} />
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
  sectionHeader: {
    paddingBottom: spacing.xs,
    paddingTop: spacing.md,
  },
  editChip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    height: 36,
    paddingHorizontal: spacing.md,
  },
  editText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
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
