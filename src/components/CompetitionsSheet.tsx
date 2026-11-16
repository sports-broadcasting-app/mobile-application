import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomSheet } from './BottomSheet';
import { useCompetition } from '../contexts/CompetitionContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTeamsById } from '../hooks/useSuperliga';
import { CompetitionSlug } from '../types/snapshot';
import { getTeamName } from '../utils/teamName';
import { COMPETITIONS, SPORTS } from '../constants/competitions';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

interface CompetitionsSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** "Suas competições": what the filters, standings and reminders show. */
export function CompetitionsSheet({
  visible,
  onClose,
}: CompetitionsSheetProps) {
  const { colors } = useTheme();
  const { followed, setFollowed } = useCompetition();
  const { favorites } = useFavorites();
  const teamsById = useTeamsById();

  const toggle = (slug: CompetitionSlug) => {
    const on = followed.includes(slug);
    // The last one stays: an app with nothing to show has no use.
    if (on && followed.length === 1) return;
    setFollowed(
      on ? followed.filter((item) => item !== slug) : [...followed, slug],
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Suas competições"
      message="Os filtros, a classificação e os avisos mostram só o que você acompanha."
      testID="competitions-sheet"
      footer={
        <TouchableOpacity
          accessibilityRole="button"
          testID="competitions-done"
          style={[styles.done, { backgroundColor: colors.primary }]}
          onPress={onClose}
        >
          <Text style={[styles.doneText, { color: colors.textOnPrimary }]}>
            Pronto
          </Text>
        </TouchableOpacity>
      }
    >
      <ScrollView>
        {SPORTS.map(({ sport, name, icon }) => {
          const items = COMPETITIONS.filter((info) => info.sport === sport);
          if (items.length === 0) return null;
          return (
            <View key={sport}>
              <View style={styles.group}>
                <MaterialCommunityIcons
                  name={icon}
                  size={iconSize.sm}
                  color={colors.sectionHeaderText}
                />
                <Text
                  style={[
                    styles.groupText,
                    { color: colors.sectionHeaderText },
                  ]}
                >
                  {name}
                </Text>
              </View>
              {items.map((info) => {
                const on = followed.includes(info.slug);
                const teamId = favorites[info.slug];
                const team = teamId ? teamsById.get(teamId) : undefined;
                const locked = on && followed.length === 1;
                return (
                  <TouchableOpacity
                    key={info.slug}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on, disabled: locked }}
                    accessibilityHint={
                      locked
                        ? 'Acompanhe outra antes de desmarcar esta'
                        : undefined
                    }
                    testID={`follow-${info.slug}`}
                    style={[
                      styles.row,
                      { borderBottomColor: colors.borderLight },
                    ]}
                    onPress={() => toggle(info.slug)}
                  >
                    <View
                      style={[
                        styles.icon,
                        { backgroundColor: colors.surfaceAlt },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={icon}
                        size={iconSize.md}
                        color={colors.textSecondary}
                      />
                    </View>
                    <View style={styles.label}>
                      <Text
                        style={[styles.name, { color: colors.textPrimary }]}
                      >
                        {info.name}
                      </Text>
                      {team ? (
                        <Text
                          style={[
                            styles.detail,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Seu time: {getTeamName(team.name)}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.check,
                        on
                          ? { backgroundColor: colors.primary }
                          : [
                              styles.unchecked,
                              { borderColor: colors.chipBorder },
                            ],
                      ]}
                    >
                      {on ? (
                        <MaterialCommunityIcons
                          name="check"
                          size={iconSize.sm}
                          color={colors.textOnPrimary}
                        />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  unchecked: {
    borderWidth: 2,
  },
  group: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
    paddingTop: spacing.md,
  },
  groupText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  icon: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  label: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  detail: {
    fontSize: typography.size.sm,
  },
  check: {
    alignItems: 'center',
    borderRadius: 7,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  done: {
    alignItems: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  doneText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
});
