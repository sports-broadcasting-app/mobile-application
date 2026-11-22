import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Sport, Standing, Team } from '../types/snapshot';
import { describeStanding } from '../utils/accessibility';
import { getTeamName } from '../utils/teamName';
import { TeamCircle } from './TeamCircle';
import { STANDINGS_COLUMNS } from '../constants/competitions';
import {
  maxFontScale,
  sectionLabel,
  spacing,
  typography,
} from '../constants/designTokens';

interface StandingsListProps {
  sport: Sport;
  standings: Standing[];
  teamsById: Map<string, Team>;
  isFavorite: (teamId: string) => boolean;
}

/**
 * The rows split by `group`, in the order they come. A competition with a
 * single table gives one unnamed group.
 */
export function groupStandings(
  standings: Standing[],
): { name: string | undefined; rows: Standing[] }[] {
  const groups: { name: string | undefined; rows: Standing[] }[] = [];
  for (const standing of standings) {
    const last = groups[groups.length - 1];
    if (last && last.name === standing.group) last.rows.push(standing);
    else groups.push({ name: standing.group, rows: [standing] });
  }
  return groups;
}

export function StandingsList({
  sport,
  standings,
  teamsById,
  isFavorite,
}: StandingsListProps) {
  const { colors } = useTheme();
  const columns = STANDINGS_COLUMNS[sport];

  const renderRow = (standing: Standing) => {
    const team = teamsById.get(standing.teamId);
    if (!team) return null;
    const favorite = isFavorite(team.id);

    return (
      <View
        key={team.id}
        accessible
        accessibilityLabel={describeStanding(
          standing,
          team.name,
          columns,
          favorite,
        )}
        testID={`standing-row-${team.id}`}
        style={[
          styles.row,
          { borderBottomColor: colors.borderLight },
          favorite && { backgroundColor: colors.primarySoft },
        ]}
      >
        <Text
          maxFontSizeMultiplier={maxFontScale}
          style={[styles.position, { color: colors.textSecondary }]}
        >
          {standing.position}
        </Text>
        <View style={styles.team}>
          <TeamCircle team={team} size={24} />
          <Text
            maxFontSizeMultiplier={maxFontScale}
            numberOfLines={1}
            style={[styles.teamCode, { color: colors.textPrimary }]}
          >
            {getTeamName(team.name)}
          </Text>
        </View>
        {columns.map(({ code, value }, index) => (
          <Text
            maxFontSizeMultiplier={maxFontScale}
            key={code}
            style={[
              styles.column,
              { color: colors.textPrimary },
              index === 0 && styles.points,
            ]}
          >
            {value(standing)}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View>
      <View
        // Each row's label names its columns; the codes alone ("P J V") are noise.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.row, { borderBottomColor: colors.border }]}
      >
        <Text
          maxFontSizeMultiplier={maxFontScale}
          style={[styles.position, { color: colors.textTertiary }]}
        >
          #
        </Text>
        <Text
          maxFontSizeMultiplier={maxFontScale}
          style={[styles.headerTeam, { color: colors.textTertiary }]}
        >
          Time
        </Text>
        {columns.map(({ code }) => (
          <Text
            maxFontSizeMultiplier={maxFontScale}
            key={code}
            style={[styles.column, { color: colors.textTertiary }]}
          >
            {code}
          </Text>
        ))}
      </View>

      {groupStandings(standings).map(({ name, rows }, index) => (
        <Fragment key={index}>
          {name !== undefined && (
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={maxFontScale}
              testID={`standing-group-${name}`}
              style={[
                styles.group,
                {
                  backgroundColor: colors.surfaceAlt,
                  color: colors.sectionHeaderText,
                },
              ]}
            >
              {name}
            </Text>
          )}
          {rows.map(renderRow)}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  group: {
    ...sectionLabel,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  position: {
    fontSize: typography.size.sm,
    width: 24,
  },
  headerTeam: {
    flex: 1,
    fontSize: typography.size.sm,
  },
  team: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  teamCode: {
    flexShrink: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  column: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    width: 32,
  },
  points: {
    fontWeight: typography.weight.bold,
  },
});
