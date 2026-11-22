import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { Team } from '../types/snapshot';
import { getTeamName } from '../utils/teamName';
import { TeamCircle } from './TeamCircle';
import {
  maxFontScale,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

export interface PeriodColumn {
  /** Column header: "1º", "1º T". */
  label: string;
  /** Read by screen readers: "1º set", "1º tempo". */
  name: string;
  home: number;
  away: number;
}

interface PeriodScoreboardProps {
  homeTeam: Team;
  awayTeam: Team;
  periods: PeriodColumn[];
  /** Last column: sets won in volleyball, the final score in football. */
  totalLabel: string;
  homeTotal: number;
  awayTotal: number;
  testID?: string;
}

/**
 * The score split by period, one row per team: sets in volleyball, halves in
 * football. Works for any sport that has partial scores.
 */
export function PeriodScoreboard({
  homeTeam,
  awayTeam,
  periods,
  totalLabel,
  homeTotal,
  awayTotal,
  testID,
}: PeriodScoreboardProps) {
  const { colors } = useTheme();

  const row = (team: Team, side: 'home' | 'away', total: number) => {
    const name = getTeamName(team.name);
    const label = [
      name,
      ...periods.map((p) => `${p.name}: ${p[side]}`),
      `${totalLabel.toLowerCase()}: ${total}`,
    ].join(', ');
    return (
      <View
        accessible
        accessibilityLabel={label}
        style={[
          styles.row,
          styles.divided,
          { borderTopColor: colors.borderLight },
        ]}
      >
        <View style={styles.team}>
          <TeamCircle team={team} size={24} />
          <Text
            maxFontSizeMultiplier={maxFontScale}
            numberOfLines={1}
            style={[styles.teamName, { color: colors.textPrimary }]}
          >
            {name}
          </Text>
        </View>
        {periods.map((period, index) => {
          const won = period[side] > period[side === 'home' ? 'away' : 'home'];
          return (
            <Text
              key={index}
              maxFontSizeMultiplier={maxFontScale}
              style={[
                styles.cell,
                { color: won ? colors.textPrimary : colors.textSecondary },
                won && styles.won,
              ]}
            >
              {period[side]}
            </Text>
          );
        })}
        <Text
          maxFontSizeMultiplier={maxFontScale}
          style={[styles.cell, styles.total, { color: colors.textPrimary }]}
        >
          {total}
        </Text>
      </View>
    );
  };

  return (
    <View
      testID={testID}
      style={[styles.table, { backgroundColor: colors.surface }]}
    >
      <View
        // The rows say each column's name; the short headers are visual.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.row}
      >
        <View style={styles.team} />
        {periods.map((period, index) => (
          <Text
            key={index}
            maxFontSizeMultiplier={maxFontScale}
            style={[styles.cell, styles.header, { color: colors.textTertiary }]}
          >
            {period.label}
          </Text>
        ))}
        <Text
          maxFontSizeMultiplier={maxFontScale}
          style={[
            styles.cell,
            styles.total,
            styles.header,
            { color: colors.textTertiary },
          ]}
        >
          {totalLabel}
        </Text>
      </View>
      {row(homeTeam, 'home', homeTotal)}
      {row(awayTeam, 'away', awayTotal)}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 40,
  },
  divided: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  team: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  teamName: {
    flexShrink: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  cell: {
    fontSize: typography.size.body,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    width: 32,
  },
  won: {
    fontWeight: typography.weight.bold,
  },
  header: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  total: {
    fontWeight: typography.weight.heavy,
    width: 44,
  },
});
