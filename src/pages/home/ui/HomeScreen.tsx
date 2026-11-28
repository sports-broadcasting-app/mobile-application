import { useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@/shared/ui/Icon';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '@/features/ads/ui/AdBanner';
import { AppText } from '@/shared/ui/AppText';
import { Card } from '@/shared/ui/Card';
import { CompetitionsSheet } from '@/features/follow-competitions/ui/CompetitionsSheet';
import { DayStrip } from './DayStrip';
import { GrandPrixCard } from './GrandPrixCard';
import { IconButton } from '@/shared/ui/IconButton';
import { MatchCard } from './MatchCard';
import { MatchRow } from './MatchRow';
import { NewsCard } from '@/features/follow-competitions/ui/NewsCard';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { SessionRow } from '@/entities/session/ui/SessionRow';
import { WatchSheet } from '@/features/watch-match/ui/WatchSheet';
import { SegmentedChips } from '@/shared/ui/SegmentedChips';
import { useCompetition } from '@/entities/competition/model/CompetitionContext';
import { useSync } from '@/shared/api/sync/SyncContext';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useHomeDay } from '../model/useHomeDay';
import { useNextSessions, useTeamsById } from '@/shared/api/queries';
import { Match } from '@/shared/api/snapshot';
import { formatDay, formatRelativeSync, getDayBounds } from '@/shared/lib/date';
import {
  chipRow,
  describeNext,
  homeTitle,
  nextTitle,
  onlySessions,
  scopeOf,
  sectionDetail,
} from '../lib/home';
import { groupByGrandPrix } from '@/entities/session/lib/sessions';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '@/shared/theme/designTokens';
import { useTabBarSpace } from '@/shared/ui/GlassTabBar';

/**
 * Jogos: a day of the week strip, filtered by sport or competition. The
 * rules (sections, chips, titles) live in utils/home.ts and the day's data in
 * useHomeDay; this file draws them.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const tabBarSpace = useTabBarSpace();
  const { lastSyncAt, refreshing, refreshFailed, refresh } = useSync();
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
  const scope = useMemo(
    () => scopeOf(filter, followed, followedIn),
    [filter, followed, followedIn],
  );
  const { day, sections, isEmpty, next, eventDays, isFavoriteMatch } =
    useHomeDay(today, offset, filter, scope);
  const chips = chipRow(filter, followedSports, followedIn);

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

  const teamsOf = (match: Match) => {
    const homeTeam = teamsById.get(match.homeTeamId);
    const awayTeam = teamsById.get(match.awayTeamId);
    return homeTeam && awayTeam ? { homeTeam, awayTeam } : null;
  };

  const renderMatch = (match: Match, inMine: boolean) => {
    const teams = teamsOf(match);
    return teams ? (
      <MatchCard
        key={match.id}
        match={match}
        {...teams}
        favorite={isFavoriteMatch(match)}
        // Section headers and the title already name the competition,
        // except in "Seus times", which mixes them.
        showCompetition={inMine}
        onPress={() => setSelected(match)}
      />
    ) : null;
  };

  // Matches on other days are a compact list: the day's games get the cards.
  const renderNextMatch = (match: Match) => {
    const teams = teamsOf(match);
    return teams ? (
      <MatchRow
        key={match.id}
        match={match}
        {...teams}
        favorite={isFavoriteMatch(match)}
        onPress={() => setSelected(match)}
      />
    ) : null;
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <AppText
          numberOfLines={1}
          // Screen titles are already large; uncapped they broke mid-word.
          capped
          style={styles.title}
        >
          {homeTitle(filter)}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {refreshFailed
            ? 'Sem conexão: mostrando dados salvos'
            : lastSyncAt !== null
              ? formatRelativeSync(lastSyncAt, Date.now())
              : ''}
        </AppText>
      </View>

      <DayStrip
        today={today}
        selected={offset}
        onSelect={setOffset}
        eventDays={eventDays}
      />
      <SegmentedChips
        // A new row starts scrolled to its beginning, back chip in view.
        key={chips.split ? chips.sport : 'sports'}
        options={chips.options}
        selected={filter}
        onSelect={(value) => setFilter(chips.pick(value))}
        scrollable
        leading={
          chips.split && (
            <IconButton
              icon="chevron-left"
              size="chip"
              accessibilityLabel="Voltar para todos os esportes"
              testID="chips-back"
              onPress={() => setFilter('todos')}
            />
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
            <Icon
              name="tune-variant"
              size={iconSize.sm}
              color={colors.primary}
            />
            <AppText variant="bodyStrong" tone="accent" capped>
              Editar
            </AppText>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
        // The content runs under the floating glass tab bar.
        scrollIndicatorInsets={{ bottom: tabBarSpace }}
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

        <AppText variant="captionStrong" style={styles.dayLabel}>
          {formatDay(day)}
        </AppText>

        {sections.map((section) => (
          <View key={section.key}>
            {section.title !== '' && (
              <SectionHeader
                title={section.title}
                testID={`section-${section.key}`}
                style={styles.sectionHeader}
                icon={
                  section.favorite ? (
                    <Icon
                      name="star"
                      size={iconSize.sm}
                      color={colors.primary}
                    />
                  ) : undefined
                }
                detail={sectionDetail(section)}
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
          <AppText variant="body" tone="secondary" style={styles.empty}>
            {onlySessions(scope)
              ? 'Nenhuma sessão neste dia'
              : 'Nenhum jogo neste dia'}
          </AppText>
        )}
        {next.length > 0 && (
          <>
            <SectionHeader
              title={nextTitle(filter, scope)}
              style={styles.sectionHeader}
            />
            <Card style={styles.nextList}>
              {next.map(({ match, session }) =>
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
            </Card>
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
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  dayLabel: {
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
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  nextList: {
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  empty: {
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
});
