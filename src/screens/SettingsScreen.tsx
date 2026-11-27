import { useState, type ReactNode } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppearancePicker } from '../components/AppearancePicker';
import { AppText } from '../components/AppText';
import { Card } from '../components/Card';
import { CheckRow } from '../components/CheckRow';
import { ReminderToggle } from '../components/ReminderToggle';
import { SportToggleRow } from '../components/SportToggleRow';
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
  radius,
  spacing,
  touchTarget,
} from '../constants/designTokens';

/** Asked once: the first team is when reminders start to make sense. */
export const REMINDERS_OFFERED_KEY = '@reminders_offered';

/** Indent of what sits under a sport, past its 34 pt icon. */
const INDENT = 34 + spacing.md;

interface LinkRowProps {
  icon: ReactNode;
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  testID: string;
}

/** "Seu time: X" or "Avisos: Y", opening the sheet that changes it. */
function LinkRow({
  icon,
  children,
  onPress,
  accessibilityLabel,
  testID,
}: LinkRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        styles.linkRow,
        { backgroundColor: colors.background, borderColor: colors.borderLight },
      ]}
      onPress={onPress}
    >
      {icon}
      <AppText numberOfLines={1} tone="secondary" style={styles.linkText}>
        {children}
      </AppText>
      <MaterialCommunityIcons
        name="chevron-right"
        size={iconSize.md}
        color={colors.textTertiary}
      />
    </TouchableOpacity>
  );
}

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
    return team ? (
      <LinkRow
        icon={<TeamCircle team={team} size={24} />}
        accessibilityLabel={`Seu time em ${name}: ${getTeamName(team.name)}. Trocar`}
        testID={`pick-team-${slug}`}
        onPress={() => setPicking(slug)}
      >
        Seu time:{' '}
        <AppText variant="bodyStrong">{getTeamName(team.name)}</AppText>
      </LinkRow>
    ) : (
      <LinkRow
        icon={
          <MaterialCommunityIcons
            name="plus"
            size={iconSize.md}
            color={colors.primary}
          />
        }
        accessibilityLabel={`Escolher seu time em ${name}`}
        testID={`pick-team-${slug}`}
        onPress={() => setPicking(slug)}
      >
        <AppText tone="accent">Escolher seu time</AppText>
      </LinkRow>
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
      <LinkRow
        icon={
          <MaterialCommunityIcons
            name="bell-outline"
            size={iconSize.md}
            color={colors.textSecondary}
          />
        }
        accessibilityLabel={`Avisos de ${name}: ${kindsLabel}. Alterar`}
        testID="session-reminders"
        onPress={() => setEditingKinds(true)}
      >
        Avisos: <AppText variant="bodyStrong">{kindsLabel}</AppText>
      </LinkRow>
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
        {/* Screen titles are already large; uncapped they broke mid-word. */}
        <AppText variant="screenTitle" capped style={styles.title}>
          Configurações
        </AppText>

        {notificationsSupported && (
          <>
            <SectionHeader title="Notificações" style={styles.sectionHeader} />
            <Card style={styles.group}>
              <ReminderToggle />
            </Card>
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
            <Card key={sport} style={[styles.group, styles.sportGroup]}>
              <SportToggleRow
                sport={sport}
                name={name}
                on={on}
                locked={sportLocked(sport)}
                onChange={(next) => setSport(sport, next)}
                accessibilityLabel={`Acompanhar ${name}`}
                compact
              />
              {on &&
                own.map((slug) => {
                  const info = getCompetition(slug);
                  const checked = followed.includes(slug);
                  return (
                    <View
                      key={slug}
                      style={[
                        styles.competition,
                        { borderTopColor: colors.borderLight },
                      ]}
                    >
                      {own.length > 1 && (
                        <CheckRow
                          label={info.name}
                          checked={checked}
                          locked={checked && competitionLocked(slug)}
                          onToggle={(next) =>
                            setCompetitionFollowed(slug, next)
                          }
                          testID={`follow-${slug}`}
                          style={styles.competitionRow}
                          labelVariant="rowTitle"
                          dimUnchecked
                        />
                      )}
                      {checked && info.sport === 'automobilismo'
                        ? renderReminderKinds(info.name)
                        : checked
                          ? renderTeamButton(slug, info.name)
                          : null}
                    </View>
                  );
                })}
            </Card>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionHeader: {
    paddingTop: spacing.xl,
  },
  group: {
    marginHorizontal: spacing.lg,
  },
  sportGroup: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  competition: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  competitionRow: {
    marginLeft: INDENT,
    minHeight: touchTarget,
  },
  linkRow: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: INDENT,
    minHeight: touchTarget,
    paddingHorizontal: spacing.md,
  },
  linkText: {
    flex: 1,
  },
});
