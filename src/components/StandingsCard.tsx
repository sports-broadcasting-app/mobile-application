import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StandingsTable } from '../types/match';
import { TeamCircle } from './TeamCircle';
import { useTheme } from '../contexts/ThemeContext';
import { useFavoriteTeams } from '../contexts/FavoriteTeamsContext';
import { getChampionshipLabel } from '../utils/championshipLabel';
import {
  spacing,
  radius,
  typography,
  iconSize,
  shadows,
} from '../constants/designTokens';

interface StandingsCardProps {
  table: StandingsTable;
  previewRows?: number;
  onPress: () => void;
}

export function StandingsCard({
  table,
  previewRows = 3,
  onPress,
}: StandingsCardProps) {
  const { colors } = useTheme();
  const { isFavorite } = useFavoriteTeams();
  const rows = table.rows.slice(0, previewRows);
  const isFootball = table.sport === 'football';
  const title = table.group
    ? `${getChampionshipLabel(table.championship)} - ${table.group}`
    : getChampionshipLabel(table.championship);

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
      testID={`standings-card-${table.championship}`}
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

      {/* Column headers */}
      <View
        style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}
      >
        <Text
          style={[
            styles.posCol,
            styles.colHeader,
            { color: colors.textTertiary },
          ]}
        >
          #
        </Text>
        <Text
          style={[
            styles.teamCol,
            styles.colHeader,
            { color: colors.textTertiary },
          ]}
        >
          Time
        </Text>
        {isFootball ? (
          <>
            <Text
              style={[
                styles.statCol,
                styles.colHeader,
                { color: colors.textTertiary },
              ]}
            >
              J
            </Text>
            <Text
              style={[
                styles.statCol,
                styles.colHeader,
                { color: colors.textTertiary },
              ]}
            >
              V
            </Text>
            <Text
              style={[
                styles.statCol,
                styles.colHeader,
                { color: colors.textTertiary },
              ]}
            >
              E
            </Text>
            <Text
              style={[
                styles.statCol,
                styles.colHeader,
                { color: colors.textTertiary },
              ]}
            >
              D
            </Text>
          </>
        ) : (
          <>
            <Text
              style={[
                styles.statCol,
                styles.colHeader,
                { color: colors.textTertiary },
              ]}
            >
              J
            </Text>
            <Text
              style={[
                styles.statCol,
                styles.colHeader,
                { color: colors.textTertiary },
              ]}
            >
              S+
            </Text>
            <Text
              style={[
                styles.statCol,
                styles.colHeader,
                { color: colors.textTertiary },
              ]}
            >
              S-
            </Text>
          </>
        )}
        <Text
          style={[
            styles.ptsCol,
            styles.colHeader,
            { color: colors.textTertiary },
          ]}
        >
          Pts
        </Text>
      </View>

      {/* Rows */}
      {rows.map((row) => {
        const highlighted = isFavorite(row.team.slug);
        return (
          <View
            key={`${row.position}-${row.team.slug}`}
            style={[
              styles.tableRow,
              { borderBottomColor: colors.borderLight },
              highlighted && {
                backgroundColor: colors.primary + '10',
              },
            ]}
          >
            <Text
              style={[
                styles.posCol,
                styles.posText,
                { color: colors.textSecondary },
              ]}
            >
              {row.position}
            </Text>
            <View style={styles.teamCol}>
              <View style={styles.teamCell}>
                <TeamCircle
                  team={{
                    id: 0,
                    name: row.team.name,
                    acronym: row.team.name.substring(0, 3).toUpperCase(),
                    slug: row.team.slug,
                    logoUrl: row.team.logoUrl,
                  }}
                  size={20}
                />
                <Text
                  style={[
                    styles.teamName,
                    { color: colors.textPrimary },
                    highlighted && { fontWeight: typography.weight.bold },
                  ]}
                  numberOfLines={1}
                >
                  {row.team.name}
                </Text>
              </View>
            </View>
            {isFootball ? (
              <>
                <Text
                  style={[
                    styles.statCol,
                    styles.statText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {row.played ?? '-'}
                </Text>
                <Text
                  style={[
                    styles.statCol,
                    styles.statText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {row.won ?? '-'}
                </Text>
                <Text
                  style={[
                    styles.statCol,
                    styles.statText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {row.drawn ?? '-'}
                </Text>
                <Text
                  style={[
                    styles.statCol,
                    styles.statText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {row.lost ?? '-'}
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={[
                    styles.statCol,
                    styles.statText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {row.played ?? '-'}
                </Text>
                <Text
                  style={[
                    styles.statCol,
                    styles.statText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {row.setsWon ?? '-'}
                </Text>
                <Text
                  style={[
                    styles.statCol,
                    styles.statText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {row.setsLost ?? '-'}
                </Text>
              </>
            )}
            <Text
              style={[
                styles.ptsCol,
                styles.ptsText,
                { color: colors.textPrimary },
              ]}
            >
              {row.points}
            </Text>
          </View>
        );
      })}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.primary }]}>
          ver completa
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
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  colHeader: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
  },
  posCol: {
    width: 24,
    textAlign: 'center',
  },
  posText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  teamCol: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  teamCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    flex: 1,
  },
  statCol: {
    width: 26,
    textAlign: 'center',
  },
  statText: {
    fontSize: typography.size.sm,
  },
  ptsCol: {
    width: 32,
    textAlign: 'center',
  },
  ptsText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
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
