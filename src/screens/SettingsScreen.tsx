import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
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
import { TeamCircle } from '../components/TeamCircle';
import { SectionHeader } from '../components/SectionHeader';
import { TeamSheet } from '../components/TeamSheet';
import { useCompetition } from '../contexts/CompetitionContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTeamsById } from '../hooks/useSuperliga';
import { CompetitionSlug, Team } from '../types/snapshot';
import { getTeamName } from '../utils/teamName';
import { promptExactAlarms } from '../utils/exactAlarmPrompt';
import { COMPETITIONS } from '../constants/competitions';
import {
  iconSize,
  radius,
  spacing,
  touchTarget,
  typography,
} from '../constants/designTokens';

/** Asked once: the first team is when reminders start to make sense. */
export const REMINDERS_OFFERED_KEY = '@reminders_offered';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { followed, setFollowed } = useCompetition();
  const { favorites } = useFavorites();
  const {
    supported: notificationsSupported,
    enabled,
    setEnabled,
    exactAlarms,
    requestExactAlarms,
  } = useNotifications();
  const teamsById = useTeamsById();
  const [picking, setPicking] = useState<CompetitionSlug | null>(null);

  const toggleFollow = (slug: CompetitionSlug, on: boolean) => {
    setFollowed(
      on ? [...followed, slug] : followed.filter((item) => item !== slug),
    );
  };

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

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
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
          title="Competições e times"
          style={styles.sectionHeader}
        />
        <View style={[styles.group, { backgroundColor: colors.surface }]}>
          {COMPETITIONS.map((info, index) => {
            const on = followed.includes(info.slug);
            const locked = on && followed.length === 1;
            const teamId = favorites[info.slug];
            const team = teamId ? teamsById.get(teamId) : undefined;
            return (
              <View
                key={info.slug}
                style={[
                  styles.competition,
                  index > 0 && {
                    borderTopColor: colors.borderLight,
                    borderTopWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={styles.competitionHead}>
                  <View
                    style={[
                      styles.icon,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <SportIcon
                      sport={info.sport}
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
                    {info.name}
                  </Text>
                  <Switch
                    accessibilityLabel={`Acompanhar ${info.name}`}
                    testID={`follow-${info.slug}`}
                    value={on}
                    disabled={locked}
                    onValueChange={(next) => toggleFollow(info.slug, next)}
                    trackColor={{ true: colors.primary }}
                  />
                </View>
                {on && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={
                      team
                        ? `Seu time em ${info.name}: ${getTeamName(team.name)}. Trocar`
                        : `Escolher seu time em ${info.name}`
                    }
                    testID={`pick-team-${info.slug}`}
                    style={[
                      styles.teamButton,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.borderLight,
                      },
                    ]}
                    onPress={() => setPicking(info.slug)}
                  >
                    {team ? (
                      <>
                        <TeamCircle team={team} size={24} />
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.teamLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Seu time:{' '}
                          <Text
                            style={[
                              styles.teamName,
                              { color: colors.textPrimary },
                            ]}
                          >
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
                        <Text
                          style={[styles.teamLabel, { color: colors.primary }]}
                        >
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
                )}
              </View>
            );
          })}
        </View>

        <SectionHeader title="Aparência" style={styles.sectionHeader} />
        <AppearancePicker />
      </ScrollView>

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
  competition: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  competitionHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
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
