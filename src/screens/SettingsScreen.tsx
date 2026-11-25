import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppearancePicker } from '../components/AppearancePicker';
import { ReminderToggle } from '../components/ReminderToggle';
import { SportIcon } from '../components/SportIcon';
import { ThemedSwitch } from '../components/ThemedSwitch';
import { TeamCircle } from '../components/TeamCircle';
import { SectionHeader } from '../components/SectionHeader';
import { SessionRemindersSheet } from '../components/SessionRemindersSheet';
import { TeamSheet } from '../components/TeamSheet';
import {
  competitionsOfSport,
  useFollowToggles,
} from '../hooks/useFollowToggles';
import { REMINDER_KINDS } from '../utils/sessions';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTeamsById } from '../hooks/useSuperliga';
import { CompetitionSlug, Team } from '../types/snapshot';
import { getTeamName } from '../utils/teamName';
import { promptExactAlarms } from '../utils/exactAlarmPrompt';
import { getCompetition, SPORTS } from '../constants/competitions';
import {
  iconSize,
  maxFontScale,
  radius,
  spacing,
  touchTarget,
  typography,
} from '../constants/designTokens';

/** Asked once: the first team is when reminders start to make sense. */
export const REMINDERS_OFFERED_KEY = '@reminders_offered';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const {
    followed,
    sportOn,
    sportLocked,
    competitionLocked,
    setSport,
    setCompetitionFollowed,
  } = useFollowToggles();
  const { favorites } = useFavorites();
  const {
    supported: notificationsSupported,
    enabled,
    setEnabled,
    exactAlarms,
    requestExactAlarms,
    sessionKinds,
  } = useNotifications();
  const teamsById = useTeamsById();
  const [picking, setPicking] = useState<CompetitionSlug | null>(null);
  const [editingKinds, setEditingKinds] = useState(false);

  const offerReminders = async (team: Team) => {
    if (!notificationsSupported || enabled) return;
    const offered = await AsyncStorage.getItem(REMINDERS_OFFERED_KEY).catch(
      () => null,
    );
    if (offered) return;
    AsyncStorage.setItem(REMINDERS_OFFERED_KEY, 'true').catch(() => {});
    Alert.alert(
      'Avisar antes dos jogos?',
      `Mandamos uma notificação 30 minutos antes de cada jogo do ${getTeamName(team.name)}, com o canal que vai transmitir.`,
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Ativar avisos',
          onPress: () => {
            setEnabled(true)
              .then(async (granted) => {
                if (granted && !exactAlarms) {
                  await promptExactAlarms(requestExactAlarms);
                }
              })
              .catch(() => {});
          },
        },
      ],
    );
  };

  const renderTeamButton = (slug: CompetitionSlug, name: string) => {
    const teamId = favorites[slug];
    const team = teamId ? teamsById.get(teamId) : undefined;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={
          team
            ? `Seu time em ${name}: ${getTeamName(team.name)}. Trocar`
            : `Escolher seu time em ${name}`
        }
        testID={`pick-team-${slug}`}
        style={[
          styles.teamButton,
          {
            backgroundColor: colors.background,
            borderColor: colors.borderLight,
          },
        ]}
        onPress={() => setPicking(slug)}
      >
        {team ? (
          <>
            <TeamCircle team={team} size={24} />
            <Text
              numberOfLines={1}
              style={[styles.teamLabel, { color: colors.textSecondary }]}
            >
              Seu time:{' '}
              <Text style={[styles.teamName, { color: colors.textPrimary }]}>
                {getTeamName(team.name)}
              </Text>
            </Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons
              name="plus"
              size={iconSize.md}
              color={colors.primary}
            />
            <Text style={[styles.teamLabel, { color: colors.primary }]}>
              Escolher seu time
            </Text>
          </>
        )}
        <MaterialCommunityIcons
          name="chevron-right"
          size={iconSize.md}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
    );
  };

  // Formula 1 has no team to follow: its reminders go by kind of session.
  const kindsLabel =
    sessionKinds.length === 0
      ? 'nenhum'
      : REMINDER_KINDS.filter(({ kind }) => sessionKinds.includes(kind))
          .map(({ label }) => label)
          .join(', ');
  const renderReminderKinds = (name: string) =>
    notificationsSupported ? (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Avisos de ${name}: ${kindsLabel}. Alterar`}
        testID="session-reminders"
        style={[
          styles.teamButton,
          {
            backgroundColor: colors.background,
            borderColor: colors.borderLight,
          },
        ]}
        onPress={() => setEditingKinds(true)}
      >
        <MaterialCommunityIcons
          name="bell-outline"
          size={iconSize.md}
          color={colors.textSecondary}
        />
        <Text
          numberOfLines={1}
          style={[styles.teamLabel, { color: colors.textSecondary }]}
        >
          Avisos:{' '}
          <Text style={[styles.teamName, { color: colors.textPrimary }]}>
            {kindsLabel}
          </Text>
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={iconSize.md}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
    ) : null;

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text
          // Screen titles are already large; uncapped they broke mid-word.
          maxFontSizeMultiplier={maxFontScale}
          style={[styles.title, { color: colors.textPrimary }]}
        >
          Configurações
        </Text>

        {notificationsSupported && (
          <>
            <SectionHeader title="Notificações" style={styles.sectionHeader} />
            <View style={[styles.group, { backgroundColor: colors.surface }]}>
              <ReminderToggle />
            </View>
          </>
        )}

        <SectionHeader
          title="Esportes e competições"
          style={styles.sectionHeader}
        />
        {SPORTS.map(({ sport, name }) => {
          const own = competitionsOfSport(sport);
          if (own.length === 0) return null;
          const on = sportOn(sport);
          return (
            <View
              key={sport}
              style={[
                styles.group,
                styles.sportGroup,
                { backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.competitionHead}>
                <View
                  style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}
                >
                  <SportIcon
                    sport={sport}
                    size={iconSize.md}
                    color={colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.competitionName,
                    { color: on ? colors.textPrimary : colors.textSecondary },
                  ]}
                >
                  {name}
                </Text>
                <ThemedSwitch
                  accessibilityLabel={`Acompanhar ${name}`}
                  testID={`follow-sport-${sport}`}
                  value={on}
                  disabled={on && sportLocked(sport)}
                  onValueChange={(next) => setSport(sport, next)}
                />
              </View>
              {on &&
                own.map((slug) => {
                  const info = getCompetition(slug);
                  const checked = followed.includes(slug);
                  const locked = checked && competitionLocked(slug);
                  return (
                    <View
                      key={slug}
                      style={[
                        styles.competition,
                        {
                          borderTopColor: colors.borderLight,
                          borderTopWidth: StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      {own.length > 1 && (
                        <TouchableOpacity
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked, disabled: locked }}
                          testID={`follow-${slug}`}
                          style={styles.competitionRow}
                          onPress={() => {
                            if (!locked) setCompetitionFollowed(slug, !checked);
                          }}
                        >
                          <Text
                            style={[
                              styles.childName,
                              {
                                color: checked
                                  ? colors.textPrimary
                                  : colors.textSecondary,
                              },
                            ]}
                          >
                            {info.name}
                          </Text>
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
                      )}
                      {checked && info.sport === 'automobilismo'
                        ? renderReminderKinds(info.name)
                        : checked
                          ? renderTeamButton(slug, info.name)
                          : null}
                    </View>
                  );
                })}
            </View>
          );
        })}

        <SectionHeader title="Aparência" style={styles.sectionHeader} />
        <AppearancePicker />
      </ScrollView>

      <SessionRemindersSheet
        visible={editingKinds}
        onClose={() => setEditingKinds(false)}
      />
      <TeamSheet
        competition={picking}
        onClose={() => setPicking(null)}
        onPicked={(_competition, team) => {
          offerReminders(team).catch(() => {});
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionHeader: {
    paddingTop: spacing.xl,
  },
  group: {
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  sportGroup: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  competition: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  competitionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginLeft: 34 + spacing.md,
    minHeight: touchTarget,
  },
  childName: {
    flex: 1,
    fontSize: typography.size.body + 1,
    fontWeight: typography.weight.semibold,
  },
  check: {
    alignItems: 'center',
    borderRadius: 7,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  unchecked: {
    borderWidth: 2,
  },
  competitionHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: touchTarget + 4,
  },
  icon: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  competitionName: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  teamButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: 34 + spacing.md,
    minHeight: touchTarget,
    paddingHorizontal: spacing.md,
  },
  teamLabel: {
    flex: 1,
    fontSize: typography.size.body,
  },
  teamName: {
    fontWeight: typography.weight.semibold,
  },
});
