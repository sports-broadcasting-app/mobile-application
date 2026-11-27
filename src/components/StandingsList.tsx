import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../contexts/ThemeContext';
import { Sport, Standing, Team } from '../types/snapshot';
import { describeStanding } from '../utils/accessibility';
import { getTeamName } from '../utils/teamName';
import { TeamCircle } from './TeamCircle';
import { STANDINGS_COLUMNS } from '../constants/competitions';
import { sectionLabel, spacing, typography } from '../constants/designTokens';

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
        <AppText
          variant="caption"
          tone="secondary"
          capped
          style={styles.position}
        >
          {standing.position}
        </AppText>
        <View style={styles.team}>
          <TeamCircle team={team} size={24} />
          <AppText
            variant="bodyStrong"
            capped
            numberOfLines={1}
            style={styles.teamCode}
          >
            {getTeamName(team.name)}
          </AppText>
        </View>
        {columns.map(({ code, value }, index) => (
          <AppText
            variant="caption"
            capped
            key={code}
            style={[styles.column, index === 0 && styles.points]}
          >
            {value(standing)}
          </AppText>
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
        <AppText
          variant="caption"
          tone="tertiary"
          capped
          style={styles.position}
        >
          #
        </AppText>
        <AppText
          variant="caption"
          tone="tertiary"
          capped
          style={styles.headerTeam}
        >
          Time
        </AppText>
        {columns.map(({ code }) => (
          <AppText
            variant="caption"
            tone="tertiary"
            capped
            key={code}
            style={styles.column}
          >
            {code}
          </AppText>
        ))}
      </View>

      {groupStandings(standings).map(({ name, rows }, index) => (
        <Fragment key={index}>
          {name !== undefined && (
            <AppText
              accessibilityRole="header"
              capped
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
            </AppText>
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
    width: 24,
  },
  headerTeam: {
    flex: 1,
  },
  team: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  teamCode: {
    flexShrink: 1,
  },
  column: {
    textAlign: 'center',
    width: 32,
  },
  points: {
    fontWeight: typography.weight.bold,
  },
});
