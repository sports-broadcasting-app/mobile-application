import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useStandings } from '../../src/hooks/useStandings';
import { StandingsTable } from '../../src/components/StandingsTable';
import { SkeletonBlock } from '../../src/components/SkeletonBlock';
import { getChampionshipLabel } from '../../src/utils/championshipLabel';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Sport } from '../../src/types/match';
import { spacing, radius, typography } from '../../src/constants/designTokens';

export default function StandingsDetailScreen() {
  const { championship, sport } = useLocalSearchParams<{
    championship: string;
    sport: string;
  }>();
  const { colors } = useTheme();
  const { tables, loading, error, refetch } = useStandings(
    championship,
    sport as Sport | undefined,
  );

  const groups = useMemo(
    () => tables.filter((t) => t.group).map((t) => t.group!),
    [tables],
  );
  const hasGroups = groups.length > 1;
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const visibleTables = useMemo(() => {
    if (!hasGroups) return tables;
    if (!selectedGroup) return tables.slice(0, 1);
    return tables.filter((t) => t.group === selectedGroup);
  }, [tables, hasGroups, selectedGroup]);

  // Auto-select first group when data arrives
  useMemo(() => {
    if (hasGroups && !selectedGroup && groups.length > 0) {
      setSelectedGroup(groups[0]);
    }
  }, [hasGroups, selectedGroup, groups]);

  const title = championship
    ? getChampionshipLabel(championship)
    : 'Classificacao';

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title }} />
        <ScrollView
          testID="skeleton-loading"
          contentContainerStyle={styles.skeletonContent}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={styles.skeletonRow}>
              <SkeletonBlock width={24} height={14} borderRadius={4} />
              <SkeletonBlock width={20} height={20} borderRadius={10} />
              <SkeletonBlock
                width={120 - (i % 3) * 10}
                height={14}
                borderRadius={4}
              />
              <View style={styles.skeletonRowRight}>
                <SkeletonBlock width={28} height={14} borderRadius={4} />
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

      {/* Group tabs for Libertadores-style tournaments */}
      {hasGroups && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupTabs}
        >
          {groups.map((group) => {
            const isActive = selectedGroup === group;
            return (
              <TouchableOpacity
                key={group}
                style={[
                  styles.groupTab,
                  isActive
                    ? { backgroundColor: colors.chipActiveBg }
                    : {
                        backgroundColor: colors.chipInactiveBg,
                        borderColor: colors.chipBorder,
                        borderWidth: 1,
                      },
                ]}
                onPress={() => setSelectedGroup(group)}
              >
                <Text
                  style={[
                    styles.groupTabText,
                    {
                      color: isActive
                        ? colors.chipActiveText
                        : colors.chipInactiveText,
                    },
                  ]}
                >
                  {group}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {visibleTables.map((table) => (
          <View
            key={`${table.championship}-${table.group ?? ''}-${table.type}`}
          >
            {table.group && !hasGroups && (
              <Text
                style={[styles.groupTitle, { color: colors.textSecondary }]}
              >
                {table.group}
              </Text>
            )}
            <StandingsTable table={table} />
          </View>
        ))}

        {visibleTables.length === 0 && (
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Nenhuma classificacao disponivel
            </Text>
          </View>
        )}
      </ScrollView>
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
  groupTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  groupTab: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  groupTabText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  groupTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
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
    paddingVertical: spacing.xs,
  },
  skeletonRowRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
