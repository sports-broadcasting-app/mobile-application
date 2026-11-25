import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomSheet } from './BottomSheet';
import { SportIcon } from './SportIcon';
import { Button } from './Button';
import { ThemedSwitch } from './ThemedSwitch';
import { useFavorites } from '../contexts/FavoritesContext';
import {
  competitionsOfSport,
  useFollowToggles,
} from '../hooks/useFollowToggles';
import { useTheme } from '../contexts/ThemeContext';
import { useTeamsById } from '../hooks/useSuperliga';
import { CompetitionSlug } from '../types/snapshot';
import { getTeamName } from '../utils/teamName';
import { getCompetition, SPORTS } from '../constants/competitions';
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

/**
 * "Suas competições": what the filters, standings and reminders show,
 * grouped by sport. The sport switch follows all its competitions; a sport
 * with more than one lists them to pick from.
 */
export function CompetitionsSheet({
  visible,
  onClose,
}: CompetitionsSheetProps) {
  const { colors } = useTheme();
  const { favorites } = useFavorites();
  const teamsById = useTeamsById();
  const {
    followed,
    sportOn,
    sportLocked,
    competitionLocked,
    setSport,
    setCompetitionFollowed,
  } = useFollowToggles();

  const teamLine = (slug: CompetitionSlug) => {
    const teamId = favorites[slug];
    const team = teamId ? teamsById.get(teamId) : undefined;
    return team ? `Seu time: ${getTeamName(team.name)}` : null;
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Suas competições"
      message="Os filtros, a classificação e os avisos mostram só o que você acompanha."
      testID="competitions-sheet"
      footer={
        <Button label="Pronto" testID="competitions-done" onPress={onClose} />
      }
    >
      <ScrollView>
        {SPORTS.map(({ sport, name }) => {
          const own = competitionsOfSport(sport);
          if (own.length === 0) return null;
          const on = sportOn(sport);
          const single = own.length === 1 ? getCompetition(own[0]) : null;
          const detail = single
            ? [single.name, teamLine(single.slug)].filter(Boolean).join(' · ')
            : null;
          return (
            <View
              key={sport}
              style={[styles.sport, { borderBottomColor: colors.borderLight }]}
            >
              <View style={styles.row}>
                <View
                  style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}
                >
                  <SportIcon
                    sport={sport}
                    size={iconSize.md}
                    color={colors.textSecondary}
                  />
                </View>
                <View style={styles.label}>
                  <Text style={[styles.name, { color: colors.textPrimary }]}>
                    {name}
                  </Text>
                  {detail ? (
                    <Text
                      style={[styles.detail, { color: colors.textSecondary }]}
                    >
                      {detail}
                    </Text>
                  ) : null}
                </View>
                <ThemedSwitch
                  accessibilityLabel={`Acompanhar ${single?.name ?? name}`}
                  testID={`follow-sport-${sport}`}
                  value={on}
                  disabled={on && sportLocked(sport)}
                  onValueChange={(next) => setSport(sport, next)}
                />
              </View>
              {!single &&
                on &&
                own.map((slug) => {
                  const info = getCompetition(slug);
                  const checked = followed.includes(slug);
                  const locked = checked && competitionLocked(slug);
                  const team = teamLine(slug);
                  return (
                    <TouchableOpacity
                      key={slug}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked, disabled: locked }}
                      accessibilityHint={
                        locked
                          ? 'Acompanhe outra antes de desmarcar esta'
                          : undefined
                      }
                      testID={`follow-${slug}`}
                      style={styles.child}
                      onPress={() => {
                        if (!locked) setCompetitionFollowed(slug, !checked);
                      }}
                    >
                      <View style={styles.label}>
                        <Text
                          style={[
                            styles.childName,
                            { color: colors.textPrimary },
                          ]}
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
                            {team}
                          </Text>
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.check,
                          checked
                            ? { backgroundColor: colors.primary }
                            : [
                                styles.unchecked,
                                { borderColor: colors.controlBorder },
                              ],
                        ]}
                      >
                        {checked ? (
                          <MaterialCommunityIcons
                            name="check"
                            size={iconSize.sm}
                            color={colors.onPrimary}
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </View>
          );
        })}
        <Text style={[styles.note, { color: colors.textTertiary }]}>
          Competições novas de um esporte que você acompanha entram sozinhas.
        </Text>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  unchecked: {
    borderWidth: 2,
  },
  sport: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 52,
  },
  child: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 48,
    paddingLeft: 36 + spacing.md,
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
    fontWeight: typography.weight.bold,
  },
  childName: {
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
  note: {
    fontSize: typography.size.sm,
    paddingTop: spacing.md,
  },
});
