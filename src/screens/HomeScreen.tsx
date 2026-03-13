import { useState, useMemo, useCallback } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Sport, Match, TeamMatch } from '../types/match';
import { useTodayMatches } from '../hooks/useTodayMatches';
import { useFavoriteTeams } from '../contexts/FavoriteTeamsContext';
import { SPORTS } from '../constants/sports';
import { MatchCard } from '../components/MatchCard';
import { MatchCardSkeleton } from '../components/MatchCardSkeleton';
import { SkeletonBlock } from '../components/SkeletonBlock';
import { FavoriteTeamBanner } from '../components/FavoriteTeamBanner';
import { ReminderSheet } from '../components/ReminderSheet';
import { useTheme } from '../contexts/ThemeContext';
import { useReminderPreferences } from '../hooks/useReminderPreferences';
import { formatTodayDate } from '../utils/dateFormat';
import {
  spacing,
  radius,
  typography,
  iconSize,
} from '../constants/designTokens';

interface HomeScreenProps {
  onPressMatch: (match: Match) => void;
  onPressSettings?: () => void;
}

export function HomeScreen({ onPressMatch, onPressSettings }: HomeScreenProps) {
  const { colors } = useTheme();
  const { highlightedMatches, loading, error, refetch } = useTodayMatches();
  const { favoriteTeams } = useFavoriteTeams();
  const { getReminder, setReminder } = useReminderPreferences();
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [reminderMatch, setReminderMatch] = useState<TeamMatch | null>(null);

  const filteredMatches = useMemo(() => {
    if (!selectedSport) return highlightedMatches;
    return highlightedMatches.filter((m) => m.sport === selectedSport);
  }, [highlightedMatches, selectedSport]);

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

  const handleSportPress = useCallback((sport: Sport) => {
    setSelectedSport((prev) => (prev === sport ? null : sport));
  }, []);

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
      <View style={styles.headerTopRow}>
        <View style={styles.logoRow}>
          <MaterialCommunityIcons
            name="television-classic"
            size={iconSize.xl}
            color={colors.primary}
          />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            OndeVer
          </Text>
        </View>
        <TouchableOpacity
          onPress={onPressSettings}
          testID="header-settings"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={iconSize.lg}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.dateRow}>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          Hoje {'\u00B7'} {formatTodayDate()}
        </Text>
        <TouchableOpacity testID="header-search">
          <MaterialCommunityIcons
            name="magnify"
            size={iconSize.lg}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {renderChips()}
    </View>
  );

  const renderChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsContainer}
    >
      {SPORTS.map(({ sport, label, icon }) => {
        const isActive = selectedSport === sport;
        return (
          <TouchableOpacity
            key={sport}
            style={[
              styles.chip,
              isActive
                ? { backgroundColor: colors.chipActiveBg }
                : {
                    backgroundColor: colors.chipInactiveBg,
                    borderColor: colors.chipBorder,
                    borderWidth: 1,
                  },
            ]}
            activeOpacity={0.7}
            onPress={() => handleSportPress(sport)}
            testID={`sport-chip-${sport}`}
          >
            <MaterialCommunityIcons
              name={icon}
              size={iconSize.sm}
              color={isActive ? colors.chipActiveText : colors.chipInactiveText}
            />
            <Text
              style={[
                styles.chipLabel,
                {
                  color: isActive
                    ? colors.chipActiveText
                    : colors.chipInactiveText,
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <ScrollView
          testID="skeleton-loading"
          contentContainerStyle={styles.skeletonContainer}
        >
          {/* Favorite banner skeleton */}
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

          {/* Section title skeleton */}
          <View style={styles.sectionTitleSkeleton}>
            <SkeletonBlock width={100} height={18} borderRadius={4} />
          </View>

          {/* Match card skeletons */}
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
      <FlatList
        data={filteredMatches}
        keyExtractor={(item: Match) => item.id}
        ListHeaderComponent={
          <>
            {favoriteMatches.map(({ match, team, opponent }) => (
              <FavoriteTeamBanner
                key={match.id}
                team={team}
                opponentName={opponent.name}
                onPress={() => onPressMatch(match)}
              />
            ))}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Jogos do Dia
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            onPress={() => onPressMatch(item)}
            onPressReminder={(match) => {
              if (match.sport !== 'formula1') {
                setReminderMatch(match as TeamMatch);
              }
            }}
            onPressWatch={(match) => onPressMatch(match)}
          />
        )}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Nenhum jogo encontrado
            </Text>
          </View>
        }
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBar} />
      {renderHeader()}
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
    paddingTop: 56,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  dateText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
    fontSize: typography.size.md,
    textAlign: 'center',
    marginHorizontal: spacing.xxxl,
  },
  retryText: {
    marginTop: spacing.md,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  emptyText: {
    fontSize: typography.size.md,
  },
});
