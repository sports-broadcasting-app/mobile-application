import { StyleSheet, View } from 'react-native';
import { SkeletonBlock } from './SkeletonBlock';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, radius, shadows } from '../constants/designTokens';

interface MatchCardSkeletonProps {
  showActions?: boolean;
}

export function MatchCardSkeleton({
  showActions = true,
}: MatchCardSkeletonProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.borderLight,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.cardContent}>
        {/* Time column */}
        <View style={styles.timeColumn}>
          <SkeletonBlock width={40} height={14} borderRadius={4} />
        </View>

        {/* Match content */}
        <View style={styles.matchContent}>
          <View style={styles.teamRow}>
            <SkeletonBlock width={24} height={24} borderRadius={12} />
            <SkeletonBlock width={100} height={14} borderRadius={4} />
          </View>
          <View style={styles.vsRow}>
            <SkeletonBlock width={16} height={12} borderRadius={4} />
          </View>
          <View style={styles.teamRow}>
            <SkeletonBlock width={24} height={24} borderRadius={12} />
            <SkeletonBlock width={80} height={14} borderRadius={4} />
          </View>
        </View>

        {/* Right column */}
        <View style={styles.rightColumn}>
          <SkeletonBlock width={56} height={20} borderRadius={10} />
        </View>
      </View>

      {showActions && (
        <View
          style={[styles.actionsRow, { borderTopColor: colors.borderLight }]}
        >
          <View style={styles.actionBtn}>
            <SkeletonBlock width={80} height={32} borderRadius={radius.sm} />
          </View>
          <View style={styles.actionBtn}>
            <SkeletonBlock width={80} height={32} borderRadius={radius.sm} />
          </View>
        </View>
      )}
    </View>
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  timeColumn: {
    alignItems: 'center',
    minWidth: 48,
  },
  matchContent: {
    flex: 1,
    gap: spacing.xs,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  vsRow: {
    paddingLeft: 32,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
  },
});
