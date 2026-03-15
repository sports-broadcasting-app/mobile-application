import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Bracket } from '../types/match';
import { TeamCircle } from './TeamCircle';
import { useTheme } from '../contexts/ThemeContext';
import { getChampionshipLabel } from '../utils/championshipLabel';
import {
  spacing,
  radius,
  typography,
  iconSize,
  shadows,
} from '../constants/designTokens';

interface BracketCardProps {
  bracket: Bracket;
  onPress: () => void;
}

export function BracketCard({ bracket, onPress }: BracketCardProps) {
  const { colors } = useTheme();
  const lastRound = bracket.rounds[bracket.rounds.length - 1];
  const previewSeries = lastRound?.series.slice(0, 2) ?? [];
  const title = getChampionshipLabel(bracket.championship);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.borderLight,
          shadowColor: colors.shadow,
        },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
      testID={`bracket-card-${bracket.championship}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="trophy-outline"
          size={iconSize.md}
          color={colors.primary}
        />
        <Text
          style={[styles.title, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* Round name */}
      {lastRound && (
        <Text style={[styles.roundName, { color: colors.textSecondary }]}>
          {lastRound.name}
        </Text>
      )}

      {/* Series preview */}
      {previewSeries.map((series, index) => {
        const homeWon = series.winner === series.homeTeam.slug;
        const awayWon = series.winner === series.awayTeam.slug;
        return (
          <View
            key={`${series.homeTeam.slug}-${series.awayTeam.slug}-${index}`}
            style={[styles.seriesRow, { borderTopColor: colors.borderLight }]}
          >
            {/* Home team */}
            <View style={styles.teamSide}>
              <TeamCircle
                team={{
                  id: 0,
                  name: series.homeTeam.name,
                  acronym: series.homeTeam.name.substring(0, 3).toUpperCase(),
                  slug: series.homeTeam.slug,
                  logoUrl: series.homeTeam.logoUrl,
                }}
                size={24}
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
            </View>

            {/* Score */}
            <View style={styles.scoreContainer}>
              <Text style={[styles.score, { color: colors.textPrimary }]}>
                {series.aggregateHome ?? '-'}
              </Text>
              <Text style={[styles.scoreSep, { color: colors.textTertiary }]}>
                x
              </Text>
              <Text style={[styles.score, { color: colors.textPrimary }]}>
                {series.aggregateAway ?? '-'}
              </Text>
            </View>

            {/* Away team */}
            <View style={[styles.teamSide, styles.teamSideRight]}>
              <Text
                style={[
                  styles.teamName,
                  styles.teamNameRight,
                  { color: colors.textPrimary },
                  awayWon && { fontWeight: typography.weight.bold },
                ]}
                numberOfLines={1}
              >
                {series.awayTeam.name}
              </Text>
              <TeamCircle
                team={{
                  id: 0,
                  name: series.awayTeam.name,
                  acronym: series.awayTeam.name.substring(0, 3).toUpperCase(),
                  slug: series.awayTeam.slug,
                  logoUrl: series.awayTeam.logoUrl,
                }}
                size={24}
              />
            </View>
          </View>
        );
      })}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.primary }]}>
          ver chaveamento
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={iconSize.sm}
          color={colors.primary}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginVertical: 6,
    borderWidth: 1,
    ...shadows.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    flex: 1,
  },
  roundName: {
    fontSize: typography.size.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  seriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  teamSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamSideRight: {
    justifyContent: 'flex-end',
  },
  teamName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    flex: 1,
  },
  teamNameRight: {
    textAlign: 'right',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  score: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    minWidth: 16,
    textAlign: 'center',
  },
  scoreSep: {
    fontSize: typography.size.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  footerText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
