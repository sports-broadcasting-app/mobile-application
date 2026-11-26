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
import {
  DayStrip,
  STRIP_FIRST_OFFSET,
  STRIP_LAST_OFFSET,
} from '../components/DayStrip';
import { GrandPrixCard } from '../components/GrandPrixCard';
import { MatchCard } from '../components/MatchCard';
import { MatchRow } from '../components/MatchRow';
import { NewsCard } from '../components/NewsCard';
import { SectionHeader } from '../components/SectionHeader';
import { SessionRow } from '../components/SessionRow';
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
  useDaySessions,
  useEventDays,
  useNextMatches,
  useNextSessions,
  useTeamsById,
} from '../hooks/useSuperliga';
import { CompetitionSlug, Match, RaceSession, Sport } from '../types/snapshot';
import {
  addDays,
  formatDay,
  formatRelativeSync,
  getDayBounds,
} from '../utils/date';
import { formatWeekend, groupByGrandPrix } from '../utils/sessions';
import {
  getCompetition,
  getSport,
  isCompetitionSlug,
} from '../constants/competitions';
import {
  iconSize,
  maxFontScale,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

/** Below this many games a day looks empty: the next ones fill it. */
const FEW_MATCHES = 3;

interface Section {
  key: string;
  title: string;
  favorite?: boolean;
  matches: Match[];
  sessions: RaceSession[];
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

const sportOf = (slug: CompetitionSlug) => getCompetition(slug).sport;

/** The next weekend of a series, for the news card. */
function describeNext(sessions: RaceSession[]): string | undefined {
  const [first] = sessions;
  if (!first) return undefined;
  const weekend = sessions.filter((s) => s.grandPrixId === first.grandPrixId);
  const when = formatWeekend(weekend);
  return `O próximo é o ${first.grandPrix}, ${when.includes(' a ') ? 'de' : 'em'} ${when}.`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { lastSyncAt, refreshing, refreshFailed, refresh } = useSync();
  const { favorites } = useFavorites();
  const teamsById = useTeamsById();
  const [offset, setOffset] = useState(0);
  const {
    filter,
    setFilter,
    followed,
    followedSports,
    followedIn,
    news,
    answerNews,
  } = useCompetition();
  const [editing, setEditing] = useState(false);
  // Match whose "where to watch" sheet is open; null keeps it closed.
  const [selected, setSelected] = useState<Match | null>(null);

  const today = new Date();
  const day = addDays(today, offset);
  const scope = useMemo(
    (): CompetitionSlug[] =>
      filter === 'todos'
        ? followed
        : isCompetitionSlug(filter)
          ? [filter]
          : followedIn(filter),
    [filter, followed, followedIn],
  );
  // One competition shown: no section headers, the title names it.
  const single = isCompetitionSlug(filter);
  const { data: dayMatches } = useDayMatches(day);
  const { data: daySessions } = useDaySessions(day);
  const eventDays = useEventDays(
    getDayBounds(addDays(today, STRIP_FIRST_OFFSET)).start,
    getDayBounds(addDays(today, STRIP_LAST_OFFSET)).end,
    scope,
  );

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
  const sessions = useMemo(
    () =>
      (daySessions ?? []).filter((session) =>
        scope.includes(session.competition),
      ),
    [daySessions, scope],
  );

  // "Todos": your teams first, then one section per competition.
  const sections = useMemo((): Section[] => {
    if (single) return [{ key: 'all', title: '', matches, sessions }];
    const mine = filter === 'todos' ? matches.filter(isFavoriteMatch) : [];
    const groups: Section[] = scope
      .map((slug) => ({
        key: slug,
        title: getCompetition(slug).name,
        matches: matches.filter(
          (match) => match.competition === slug && !mine.includes(match),
        ),
        sessions: sessions.filter((session) => session.competition === slug),
      }))
      .filter(
        (section) => section.matches.length + section.sessions.length > 0,
      );
    return mine.length > 0
      ? [
          {
            key: 'mine',
            title: 'Seus times',
            favorite: true,
            matches: mine,
            sessions: [],
          },
          ...groups,
        ]
      : groups;
  }, [single, filter, scope, matches, sessions, isFavoriteMatch]);

  const total = matches.length + sessions.length;
  const loaded = dayMatches !== undefined && daySessions !== undefined;
  const isEmpty = loaded && total === 0;
  const showNext = loaded && total < FEW_MATCHES;
  const nextFrom = getDayBounds(day).end;
  const { data: nextMatches } = useNextMatches(nextFrom, scope, showNext);
  const { data: nextSessions } = useNextSessions(nextFrom, scope, showNext);
  // Games and sessions in one list, soonest first.
  const nextItems = useMemo(
    () =>
      [
        ...(nextMatches ?? []).map((match) => ({ match, session: null })),
        ...(nextSessions ?? []).map((session) => ({ match: null, session })),
      ]
        .sort(
          (a, b) =>
            Date.parse((a.match ?? a.session)!.startsAt) -
            Date.parse((b.match ?? b.session)!.startsAt),
        )
        .slice(0, 6),
    [nextMatches, nextSessions],
  );

  const [newCompetition] = news;
  // From the start of today: a stable query key all day long.
  const { data: newSessions } = useNextSessions(
    getDayBounds(today).start,
    newCompetition ? [newCompetition] : [],
    Boolean(newCompetition),
    12,
  );

  const openGrandPrix = (grandPrixId: string) =>
    router.push(`/grand-prix/${grandPrixId}`);

  const renderMatch = (match: Match, inMine: boolean) => {
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
        showCompetition={inMine}
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

  // One chip per sport; a sport with a single followed competition shows
  // that competition (Brasileirão, F1), as there is nothing to split.
  const filters: { value: CompetitionFilter; label: string; sport?: Sport }[] =
    [
      { value: 'todos', label: 'Todos' },
      ...followedSports.map((sport) => {
        const inSport = followedIn(sport);
        return inSport.length === 1
          ? {
              value: inSport[0] as CompetitionFilter,
              label: getCompetition(inSport[0]).label,
              sport,
            }
          : {
              value: sport as CompetitionFilter,
              label: getSport(sport).name,
              sport,
            };
      }),
    ];
  const filterSport: Sport | null =
    filter === 'todos'
      ? null
      : isCompetitionSlug(filter)
        ? sportOf(filter)
        : filter;
  const sportCompetitions = filterSport ? followedIn(filterSport) : [];
  // A sport with 2+ followed competitions swaps the row for them, with a
  // back chip: picking the sport already shows all of it, so no "Todas".
  const split = filterSport !== null && sportCompetitions.length > 1;
  const rowOptions: {
    value: CompetitionFilter;
    label: string;
    sport?: Sport;
  }[] = split
    ? sportCompetitions.map((slug) => ({
        value: slug as CompetitionFilter,
        label: getCompetition(slug).label,
      }))
    : filters;
  const onChip = (value: CompetitionFilter) =>
    // The picked competition again goes back to the whole sport.
    setFilter(split && value === filter ? (filterSport ?? 'todos') : value);

  const title =
    filter === 'todos'
      ? 'Jogos'
      : isCompetitionSlug(filter)
        ? getCompetition(filter).name
        : getSport(filter).name;
  const onlySessions = scope.every((slug) => sportOf(slug) === 'automobilismo');
  const nextTitle = onlySessions
    ? 'Próximas sessões'
    : single
      ? `Próximos jogos · ${getCompetition(filter).label}`
      : 'Próximos jogos';

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text
          numberOfLines={1}
          // Screen titles are already large; uncapped they broke mid-word.
          maxFontSizeMultiplier={maxFontScale}
          style={[styles.title, { color: colors.textPrimary }]}
        >
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {refreshFailed
            ? 'Sem conexão: mostrando dados salvos'
            : lastSyncAt !== null
              ? formatRelativeSync(lastSyncAt, Date.now())
              : ''}
        </Text>
      </View>

      <DayStrip
        today={today}
        selected={offset}
        onSelect={setOffset}
        eventDays={eventDays}
      />
      <SegmentedChips
        // A new row starts scrolled to its beginning, back chip in view.
        key={split ? filterSport : 'sports'}
        options={rowOptions}
        selected={filter}
        onSelect={onChip}
        scrollable
        leading={
          split && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Voltar para todos os esportes"
              testID="chips-back"
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              style={[
                styles.backChip,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.controlBorder,
                },
              ]}
              onPress={() => setFilter('todos')}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={iconSize.md}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          )
        }
        trailing={
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Editar esportes e competições"
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
            <Text
              maxFontSizeMultiplier={maxFontScale}
              style={[styles.editText, { color: colors.primary }]}
            >
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
        {newCompetition && (
          <NewsCard
            competition={newCompetition}
            next={describeNext(newSessions ?? [])}
            onFollow={() => answerNews(newCompetition, true)}
            onDismiss={() => answerNews(newCompetition, false)}
          />
        )}

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
                  section.favorite
                    ? undefined
                    : section.sessions.length > 0
                      ? plural(section.sessions.length, 'sessão', 'sessões')
                      : plural(section.matches.length, 'jogo', 'jogos')
                }
              />
            )}
            {section.matches.map((match) =>
              renderMatch(match, Boolean(section.favorite)),
            )}
            {groupByGrandPrix(section.sessions).map((group) => (
              <GrandPrixCard
                key={group.grandPrixId}
                grandPrix={group.grandPrix}
                circuit={group.circuit}
                sessions={group.sessions}
                onPress={() => openGrandPrix(group.grandPrixId)}
              />
            ))}
          </View>
        ))}

        {isEmpty && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            {onlySessions
              ? 'Nenhuma sessão neste dia'
              : 'Nenhum jogo neste dia'}
          </Text>
        )}
        {showNext && nextItems.length > 0 && (
          <>
            <SectionHeader title={nextTitle} style={styles.sectionHeader} />
            <View
              style={[styles.nextList, { backgroundColor: colors.surface }]}
            >
              {nextItems.map(({ match, session }) =>
                match ? (
                  renderNextMatch(match)
                ) : session ? (
                  <SessionRow
                    key={session.id}
                    session={session}
                    onPress={() => openGrandPrix(session.grandPrixId)}
                  />
                ) : null,
              )}
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
  backChip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  editChip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 36,
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
