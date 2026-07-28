import { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Match, Sport, TeamMatch } from '../types/match';
import { useTodayMatches } from '../hooks/useTodayMatches';
import { useFavoriteTeams } from '../contexts/FavoriteTeamsContext';
import { MatchRow } from '../components/MatchRow';
import { MatchCardSkeleton } from '../components/MatchCardSkeleton';
import { SkeletonBlock } from '../components/SkeletonBlock';
import { FavoriteTeamBanner } from '../components/FavoriteTeamBanner';
import { ReminderSheet } from '../components/ReminderSheet';
import { useTheme } from '../contexts/ThemeContext';
import { useReminderPreferences } from '../hooks/useReminderPreferences';
import { formatTodayLong } from '../utils/dateFormat';
import { radius, spacing } from '../constants/designTokens';

interface HomeScreenProps {
  onPressMatch: (match: Match) => void;
}

type TabKey = 'all' | Sport;

const SPORT_TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'football', label: 'Futebol' },
  { key: 'volleyball', label: 'Volei' },
  { key: 'formula1', label: 'F1' },
];

interface MatchSection {
  key: 'live' | 'upcoming' | 'ended';
  title: string;
  data: Match[];
  dim?: boolean;
}

export function HomeScreen({ onPressMatch }: HomeScreenProps) {
  const { colors } = useTheme();
  const { highlightedMatches, loading, error, refetch } = useTodayMatches();
  const { favoriteTeams } = useFavoriteTeams();
  const { getReminder, setReminder } = useReminderPreferences();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [reminderMatch, setReminderMatch] = useState<TeamMatch | null>(null);

  const filteredMatches = useMemo(() => {
    if (activeTab === 'all') return highlightedMatches;
    return highlightedMatches.filter((m) => m.sport === activeTab);
  }, [highlightedMatches, activeTab]);

  const sections = useMemo<MatchSection[]>(() => {
    const live = filteredMatches.filter((m) => m.status === 'match-live');
    const upcoming = filteredMatches.filter(
      (m) => m.status === 'match-not-started',
    );
    const ended = filteredMatches.filter((m) => m.status === 'match-ended');

    const result: MatchSection[] = [];
    if (live.length) {
      result.push({ key: 'live', title: 'AO VIVO', data: live });
    }
    if (upcoming.length) {
      result.push({ key: 'upcoming', title: 'MAIS TARDE', data: upcoming });
    }
    if (ended.length) {
      result.push({
        key: 'ended',
        title: 'ENCERRADOS',
        data: ended,
        dim: true,
      });
    }
    return result;
  }, [filteredMatches]);

  const favoriteMatches = useMemo(() => {
    if (favoriteTeams.length === 0) return [];
    const slugs = new Set(favoriteTeams.map((f) => f.team.slug));
    const seen = new Set<string>();

    return filteredMatches
      .filter((m): m is TeamMatch => {
        if (m.sport === 'formula1') return false;
        if (seen.has(m.id)) return false;
        const matches =
          slugs.has(m.homeTeam.slug) || slugs.has(m.awayTeam.slug);
        if (matches) seen.add(m.id);
        return matches;
      })
      .map((match) => {
        const favEntry = favoriteTeams.find(
          (f) =>
            match.homeTeam.slug === f.team.slug ||
            match.awayTeam.slug === f.team.slug,
        )!;
        const opponent =
          match.homeTeam.slug === favEntry.team.slug
            ? match.awayTeam
            : match.homeTeam;
        return { match, team: favEntry.team, opponent };
      });
  }, [filteredMatches, favoriteTeams]);

  const handleTabPress = useCallback((key: TabKey) => {
    setActiveTab(key);
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Hoje</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            testID="header-search"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            testID="header-notifications"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
        {formatTodayLong()}
      </Text>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
      {SPORT_TABS.map((t) => {
        const active = activeTab === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => handleTabPress(t.key)}
            testID={`sport-tab-${t.key}`}
            activeOpacity={0.7}
            style={[
              styles.tab,
              {
                borderBottomColor: active ? colors.primary : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: active ? colors.textPrimary : colors.textTertiary,
                  fontWeight: active ? '700' : '500',
                },
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderListHeader = () => (
    <View>
      {favoriteMatches.map(({ match, team, opponent }) => (
        <FavoriteTeamBanner
          key={match.id}
          team={team}
          opponentName={opponent.name}
          onPress={() => onPressMatch(match)}
        />
      ))}
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <ScrollView
          testID="skeleton-loading"
          contentContainerStyle={styles.skeletonContainer}
        >
          <View
            style={[
              styles.bannerSkeleton,
              {
                backgroundColor: colors.surfaceCard,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <SkeletonBlock width={40} height={40} borderRadius={20} />
            <View style={styles.bannerSkeletonText}>
              <SkeletonBlock width={120} height={14} borderRadius={4} />
              <SkeletonBlock width={160} height={12} borderRadius={4} />
            </View>
          </View>
          <View style={styles.sectionTitleSkeleton}>
            <SkeletonBlock width={100} height={18} borderRadius={4} />
          </View>
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </ScrollView>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <Text
            style={[styles.retryText, { color: colors.primary }]}
            onPress={refetch}
          >
            Tentar novamente
          </Text>
        </View>
      );
    }

    return (
      <SectionList
        sections={sections}
        keyExtractor={(item: Match) => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={renderListHeader()}
        renderSectionHeader={({ section }) => (
          <View
            style={[styles.sectionHeader, { backgroundColor: colors.surface }]}
          >
            <Text
              style={[
                styles.sectionLabel,
                {
                  color: section.dim ? colors.textTertiary : colors.textPrimary,
                },
              ]}
            >
              {section.title}
            </Text>
            <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
              {section.data.length}
            </Text>
          </View>
        )}
        renderItem={({ item, section }) => (
          <MatchRow
            match={item}
            onPress={() => onPressMatch(item)}
            dim={(section as MatchSection).dim}
          />
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Nenhum jogo encontrado para esse esporte.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        onRefresh={refetch}
        refreshing={loading}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <StatusBar style={colors.statusBar} />
      {renderHeader()}
      {renderTabs()}
      {renderContent()}

      <ReminderSheet
        visible={reminderMatch !== null}
        match={reminderMatch}
        selectedTiming={reminderMatch ? getReminder(reminderMatch.id) : null}
        onSelect={(timing) => {
          if (reminderMatch) {
            setReminder(reminderMatch.id, timing);
            setReminderMatch(null);
          }
        }}
        onCancel={() => setReminderMatch(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.56,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  tab: {
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 2,
    marginBottom: -1,
  },
  tabLabel: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '400',
  },
  listContent: {
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  skeletonContainer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  bannerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bannerSkeletonText: {
    flex: 1,
    gap: spacing.sm,
  },
  sectionTitleSkeleton: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryText: {
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
