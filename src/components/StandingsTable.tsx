import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StandingsTable as StandingsTableType } from '../types/match';
import { TeamCircle } from './TeamCircle';
import { useTheme } from '../contexts/ThemeContext';
import { useFavoriteTeams } from '../contexts/FavoriteTeamsContext';
import { spacing, typography } from '../constants/designTokens';

interface StandingsTableProps {
  table: StandingsTableType;
}

export function StandingsTable({ table }: StandingsTableProps) {
  const { colors } = useTheme();
  const { isFavorite } = useFavoriteTeams();
  const isFootball = table.sport === 'football';
  const isF1 = table.sport === 'formula1';

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Column headers */}
        <View
          style={[
            styles.row,
            styles.headerRow,
            { borderBottomColor: colors.border },
          ]}
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
            {isF1 ? 'Piloto' : 'Time'}
          </Text>
          {isF1 ? (
            <>
              <Text
                style={[
                  styles.wideStatCol,
                  styles.colHeader,
                  { color: colors.textTertiary },
                ]}
              >
                Equipe
              </Text>
              <Text
                style={[
                  styles.statCol,
                  styles.colHeader,
                  { color: colors.textTertiary },
                ]}
              >
                Vit
              </Text>
            </>
          ) : isFootball ? (
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
              <Text
                style={[
                  styles.statCol,
                  styles.colHeader,
                  { color: colors.textTertiary },
                ]}
              >
                GP
              </Text>
              <Text
                style={[
                  styles.statCol,
                  styles.colHeader,
                  { color: colors.textTertiary },
                ]}
              >
                GC
              </Text>
              <Text
                style={[
                  styles.statCol,
                  styles.colHeader,
                  { color: colors.textTertiary },
                ]}
              >
                SG
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
                V
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

        {/* Data rows */}
        {table.rows.map((row) => {
          const highlighted = !isF1 && isFavorite(row.team.slug);
          return (
            <View
              key={`${row.position}-${row.team.slug}`}
              style={[
                styles.row,
                { borderBottomColor: colors.borderLight },
                highlighted && { backgroundColor: colors.primary + '10' },
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
                  {!isF1 && (
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
                  )}
                  <Text
                    style={[
                      styles.teamName,
                      { color: colors.textPrimary },
                      highlighted && { fontWeight: typography.weight.bold },
                    ]}
                    numberOfLines={1}
                  >
                    {isF1 ? (row.driver ?? row.team.name) : row.team.name}
                  </Text>
                </View>
              </View>
              {isF1 ? (
                <>
                  <Text
                    style={[
                      styles.wideStatCol,
                      styles.statText,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {row.constructorName ?? '-'}
                  </Text>
                  <Text
                    style={[
                      styles.statCol,
                      styles.statText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {row.wins ?? '-'}
                  </Text>
                </>
              ) : isFootball ? (
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
                  <Text
                    style={[
                      styles.statCol,
                      styles.statText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {row.goalsFor ?? '-'}
                  </Text>
                  <Text
                    style={[
                      styles.statCol,
                      styles.statText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {row.goalsAgainst ?? '-'}
                  </Text>
                  <Text
                    style={[
                      styles.statCol,
                      styles.statText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {row.goalDifference ?? '-'}
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
                    {row.won ?? '-'}
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerRow: {
    borderBottomWidth: 2,
  },
  colHeader: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
  },
  posCol: {
    width: 28,
    textAlign: 'center',
  },
  posText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  teamCol: {
    width: 140,
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
    width: 30,
    textAlign: 'center',
  },
  wideStatCol: {
    width: 80,
    textAlign: 'center',
  },
  statText: {
    fontSize: typography.size.sm,
  },
  ptsCol: {
    width: 36,
    textAlign: 'center',
  },
  ptsText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
});
