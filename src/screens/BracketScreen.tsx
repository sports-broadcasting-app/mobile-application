import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useBrackets } from '../hooks/useBrackets';
import { TeamCircle } from '../components/TeamCircle';
import { SkeletonBlock } from '../components/SkeletonBlock';
import { getChampionshipLabel } from '../utils/championshipLabel';
import { useTheme } from '../contexts/ThemeContext';
import { BracketSeries, Sport } from '../types/match';
import {
  spacing,
  radius,
  typography,
  shadows,
} from '../constants/designTokens';

export default function BracketScreen() {
  const { championship, sport } = useLocalSearchParams<{
    championship: string;
    sport: string;
  }>();
  const { colors } = useTheme();
  const { brackets, loading, error, refetch } = useBrackets(
    championship,
    sport as Sport | undefined,
  );

  const bracket = brackets[0];
  const rounds = useMemo(() => bracket?.rounds ?? [], [bracket]);
  const roundNames = useMemo(() => rounds.map((r) => r.name), [rounds]);

  const [selectedRound, setSelectedRound] = useState<string | null>(null);

  // Auto-select last round when data arrives
  useMemo(() => {
    if (roundNames.length > 0 && !selectedRound) {
      setSelectedRound(roundNames[roundNames.length - 1]);
    }
  }, [roundNames, selectedRound]);

  const activeSeries = useMemo(() => {
    if (!selectedRound) return [];
    const round = rounds.find((r) => r.name === selectedRound);
    return round?.series ?? [];
  }, [rounds, selectedRound]);

  const title = championship
    ? getChampionshipLabel(championship)
    : 'Chaveamento';

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title }} />
        <ScrollView
          testID="skeleton-loading"
          contentContainerStyle={styles.skeletonContent}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.seriesCard,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: colors.borderLight,
                  shadowColor: colors.shadow,
                },
              ]}
            >
              <View style={styles.skeletonRow}>
                <SkeletonBlock width={28} height={28} borderRadius={14} />
                <SkeletonBlock width={120} height={14} borderRadius={4} />
                <View style={styles.skeletonRight}>
                  <SkeletonBlock width={20} height={14} borderRadius={4} />
                </View>
              </View>
              <View style={styles.skeletonRow}>
                <SkeletonBlock width={28} height={28} borderRadius={14} />
                <SkeletonBlock width={100} height={14} borderRadius={4} />
                <View style={styles.skeletonRight}>
                  <SkeletonBlock width={20} height={14} borderRadius={4} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title }} />
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <Text
            style={[styles.retryText, { color: colors.primary }]}
            onPress={() => refetch()}
          >
            Tentar novamente
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title }} />

      {/* Round tabs */}
      {roundNames.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roundTabs}
        >
          {roundNames.map((name) => {
            const isActive = selectedRound === name;
            return (
              <TouchableOpacity
                key={name}
                style={[
                  styles.roundTab,
                  isActive
                    ? { backgroundColor: colors.chipActiveBg }
                    : {
                        backgroundColor: colors.chipInactiveBg,
                        borderColor: colors.chipBorder,
                        borderWidth: 1,
                      },
                ]}
                onPress={() => setSelectedRound(name)}
              >
                <Text
                  style={[
                    styles.roundTabText,
                    {
                      color: isActive
                        ? colors.chipActiveText
                        : colors.chipInactiveText,
                    },
                  ]}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Series list */}
      <ScrollView contentContainerStyle={styles.content}>
        {activeSeries.map((series, index) => (
          <SeriesCard
            key={`${series.homeTeam.slug}-${series.awayTeam.slug}-${index}`}
            series={series}
            colors={colors}
          />
        ))}

        {activeSeries.length === 0 && (
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Nenhum confronto disponivel
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface SeriesCardProps {
  series: BracketSeries;
  colors: ReturnType<typeof useTheme>['colors'];
}

function SeriesCard({ series, colors }: SeriesCardProps) {
  const homeWon = series.winner === series.homeTeam.slug;
  const awayWon = series.winner === series.awayTeam.slug;

  return (
    <View
      style={[
        styles.seriesCard,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.borderLight,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Home team row */}
      <View
        style={[
          styles.teamRow,
          { borderBottomColor: colors.borderLight },
          homeWon && { backgroundColor: colors.primary + '10' },
        ]}
      >
        <TeamCircle
          team={{
            id: 0,
            name: series.homeTeam.name,
            acronym: series.homeTeam.name.substring(0, 3).toUpperCase(),
            slug: series.homeTeam.slug,
            logoUrl: series.homeTeam.logoUrl,
          }}
          size={28}
        />
        <Text
          style={[
            styles.teamName,
            { color: colors.textPrimary },
            homeWon && { fontWeight: typography.weight.bold },
          ]}
          numberOfLines={1}
        >
          {series.homeTeam.name}
        </Text>
        <Text
          style={[
            styles.aggregateScore,
            { color: colors.textPrimary },
            homeWon && { fontWeight: typography.weight.bold },
          ]}
        >
          {series.aggregateHome ?? '-'}
        </Text>
      </View>

      {/* Away team row */}
      <View
        style={[
          styles.teamRow,
          awayWon && { backgroundColor: colors.primary + '10' },
        ]}
      >
        <TeamCircle
          team={{
            id: 0,
            name: series.awayTeam.name,
            acronym: series.awayTeam.name.substring(0, 3).toUpperCase(),
            slug: series.awayTeam.slug,
            logoUrl: series.awayTeam.logoUrl,
          }}
          size={28}
        />
        <Text
          style={[
            styles.teamName,
            { color: colors.textPrimary },
            awayWon && { fontWeight: typography.weight.bold },
          ]}
          numberOfLines={1}
        >
          {series.awayTeam.name}
        </Text>
        <Text
          style={[
            styles.aggregateScore,
            { color: colors.textPrimary },
            awayWon && { fontWeight: typography.weight.bold },
          ]}
        >
          {series.aggregateAway ?? '-'}
        </Text>
      </View>

      {/* Individual matches */}
      {series.matches.length > 0 && (
        <View
          style={[
            styles.matchesSection,
            { borderTopColor: colors.borderLight },
          ]}
        >
          {series.matches.map((match, i) => (
            <View key={i} style={styles.matchRow}>
              <Text style={[styles.matchDate, { color: colors.textTertiary }]}>
                {match.date}
              </Text>
              <Text
                style={[styles.matchScore, { color: colors.textSecondary }]}
              >
                {match.homeScore ?? '-'} x {match.awayScore ?? '-'}
              </Text>
              {match.status === 'live' && (
                <Text style={[styles.liveBadge, { color: colors.error }]}>
                  AO VIVO
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  roundTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  roundTab: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  roundTabText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  seriesCard: {
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    borderWidth: 1,
    ...shadows.sm,
    overflow: 'hidden',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  teamName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    flex: 1,
  },
  aggregateScore: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    minWidth: 24,
    textAlign: 'center',
  },
  matchesSection: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  matchDate: {
    fontSize: typography.size.xs,
    flex: 1,
  },
  matchScore: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  liveBadge: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
  skeletonContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skeletonRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
