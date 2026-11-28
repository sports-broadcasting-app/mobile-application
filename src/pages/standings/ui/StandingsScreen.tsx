import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '@/features/ads/ui/AdBanner';
import { SegmentedChips } from '@/shared/ui/SegmentedChips';
import { StandingsList } from './StandingsList';
import { useCompetition } from '@/entities/competition/model/CompetitionContext';
import { useFavorites } from '@/entities/team/model/FavoritesContext';
import { useSync } from '@/shared/api/sync/SyncContext';
import { useTheme } from '@/shared/theme/ThemeContext';
import {
  useHasTransfers,
  useStandings,
  useTeamsById,
} from '@/shared/api/queries';
import {
  COMPETITION_OPTIONS,
  getCompetition,
  STANDINGS_COLUMNS,
} from '@/shared/config/competitions';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '@/shared/theme/designTokens';
import { useTabBarSpace } from '@/shared/ui/GlassTabBar';

export default function StandingsScreen() {
  const { colors } = useTheme();
  const tabBarSpace = useTabBarSpace();
  const { refreshing, refresh } = useSync();
  const { isFavorite } = useFavorites();
  const teamsById = useTeamsById();
  const { competition, setCompetition, followed } = useCompetition();
  const { data: standings } = useStandings(competition);
  const hasTransfers = useHasTransfers(competition);
  const router = useRouter();
  const { sport } = getCompetition(competition);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <AppText
          variant="screenTitle"
          // Screen titles are already large; uncapped they broke mid-word.
          capped
        >
          Classificação
        </AppText>
      </View>
      <SegmentedChips
        options={COMPETITION_OPTIONS.filter((option) =>
          followed.includes(option.value),
        )}
        selected={competition}
        onSelect={setCompetition}
        scrollable
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
        // The content runs under the floating glass tab bar.
        scrollIndicatorInsets={{ bottom: tabBarSpace }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        {hasTransfers && (
          <TouchableOpacity
            accessibilityRole="button"
            testID="open-transfers"
            style={[styles.transfers, { backgroundColor: colors.surface }]}
            onPress={() =>
              router.push({
                pathname: '/transferencias',
                params: { competition },
              })
            }
          >
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={iconSize.md}
              color={colors.primary}
            />
            <AppText variant="bodyStrong" style={styles.transfersText}>
              Transferências da temporada
            </AppText>
            <MaterialCommunityIcons
              name="chevron-right"
              size={iconSize.md}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
        {STANDINGS_COLUMNS[sport].length === 0 ? (
          <AppText
            variant="body"
            tone="secondary"
            testID="standings-unavailable"
            style={styles.unavailable}
          >
            {`A classificação da ${getCompetition(competition).name} ainda não está no app. O calendário e onde passa cada sessão estão em Jogos.`}
          </AppText>
        ) : (
          <StandingsList
            sport={sport}
            standings={standings ?? []}
            teamsById={teamsById}
            isFavorite={isFavorite}
          />
        )}
        <View style={styles.legend} testID="standings-legend">
          {STANDINGS_COLUMNS[sport].map(({ code, label }) => (
            <AppText
              variant="caption"
              tone="tertiary"
              key={code}
              style={styles.legendItem}
            >
              <AppText
                variant="caption"
                tone="secondary"
                style={styles.legendCode}
              >
                {code}
              </AppText>
              {`  ${label}`}
            </AppText>
          ))}
        </View>
        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  content: {
    // Lets the ad banner sit right above the tab bar on a short table.
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  transfers: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
  },
  transfersText: {
    flex: 1,
  },
  unavailable: {
    lineHeight: 20,
    padding: spacing.lg,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    rowGap: spacing.sm,
  },
  legendItem: {
    width: '50%',
  },
  legendCode: {
    fontWeight: typography.weight.bold,
  },
});
