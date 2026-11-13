import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Standing, Team } from '../types/superliga';
import { getTeamName } from '../utils/teamName';
import { TeamCircle } from './TeamCircle';
import { spacing, typography } from '../constants/designTokens';

const COLUMNS = ['P', 'J', 'V', 'D', 'SV', 'SP'];

interface StandingsListProps {
  standings: Standing[];
  teamsById: Map<string, Team>;
  isFavorite: (teamId: string) => boolean;
}

export function StandingsList({
  standings,
  teamsById,
  isFavorite,
}: StandingsListProps) {
  const { colors } = useTheme();

  return (
    <View>
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        <Text style={[styles.position, { color: colors.textTertiary }]}>#</Text>
        <Text style={[styles.headerTeam, { color: colors.textTertiary }]}>
          Time
        </Text>
        {COLUMNS.map((column) => (
          <Text
            key={column}
            style={[styles.column, { color: colors.textTertiary }]}
          >
            {column}
          </Text>
        ))}
      </View>

      {standings.map((standing) => {
        const team = teamsById.get(standing.teamId);
        if (!team) return null;
        const favorite = isFavorite(team.id);

        return (
          <View
            key={team.id}
            testID={`standing-row-${team.id}`}
            style={[
              styles.row,
              { borderBottomColor: colors.borderLight },
              favorite && { backgroundColor: colors.broadcastBadgeBg },
            ]}
          >
            <Text style={[styles.position, { color: colors.textSecondary }]}>
              {standing.position}
            </Text>
            <View style={styles.team}>
              <TeamCircle team={team} size={24} />
              <Text
                numberOfLines={1}
                style={[styles.teamCode, { color: colors.textPrimary }]}
              >
                {getTeamName(team.name)}
              </Text>
            </View>
            {[
              standing.points,
              standing.matches,
              standing.wins,
              standing.losses,
              standing.setsWon,
              standing.setsLost,
            ].map((value, index) => (
              <Text
                key={COLUMNS[index]}
                style={[
                  styles.column,
                  { color: colors.textPrimary },
                  index === 0 && styles.points,
                ]}
              >
                {value}
              </Text>
            ))}
          </View>
        );
      })}
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
