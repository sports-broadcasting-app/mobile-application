import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StandingsTable } from '../types/match';
import { useTheme } from '../contexts/ThemeContext';
import { getChampionshipLabel } from '../utils/championshipLabel';
import {
  spacing,
  radius,
  typography,
  iconSize,
  shadows,
} from '../constants/designTokens';

interface F1StandingsCardProps {
  table: StandingsTable;
  previewRows?: number;
  onPress: () => void;
}

export function F1StandingsCard({
  table,
  previewRows = 3,
  onPress,
}: F1StandingsCardProps) {
  const { colors } = useTheme();
  const rows = table.rows.slice(0, previewRows);
  const subtitle =
    table.type === 'driver'
      ? 'Pilotos'
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
      testID={`standings-card-${table.championship}-${table.type}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="flag-checkered"
          size={iconSize.md}
          color={colors.primary}
        />
        <Text
          style={[styles.title, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          Formula 1 - {subtitle}
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
            styles.driverCol,
            styles.colHeader,
            { color: colors.textTertiary },
          ]}
        >
          Piloto
        </Text>
        <Text
          style={[
            styles.teamCol,
            styles.colHeader,
            { color: colors.textTertiary },
          ]}
        >
          Equipe
        </Text>
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
      {rows.map((row) => (
        <View
          key={`${row.position}-${row.team.slug}`}
          style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}
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
          <Text
            style={[
              styles.driverCol,
              styles.driverText,
              { color: colors.textPrimary },
            ]}
            numberOfLines={1}
          >
            {row.driver ?? row.team.name}
          </Text>
          <Text
            style={[
              styles.teamCol,
              styles.constructorText,
              { color: colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {row.constructorName ?? '-'}
          </Text>
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
      ))}

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
    width: 28,
    textAlign: 'center',
  },
  posText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  driverCol: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  driverText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  teamCol: {
    width: 80,
    textAlign: 'center',
  },
  constructorText: {
    fontSize: typography.size.sm,
  },
  ptsCol: {
    width: 40,
    textAlign: 'right',
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
