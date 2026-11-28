import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/shared/ui/Icon';
import { Stack, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/shared/ui/AppText';
import { Card } from '@/shared/ui/Card';
import { ChannelButtons } from '@/entities/broadcast/ui/ChannelButtons';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { useNotifications } from '@/features/reminders/model/NotificationsContext';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useGrandPrix } from '@/shared/api/queries';
import { RaceSession } from '@/shared/api/snapshot';
import { promptExactAlarms } from '@/features/reminders/lib/exactAlarmPrompt';
import { formatDay, formatTime } from '@/shared/lib/date';
import {
  describeSession,
  formatWeekend,
  groupByDay,
  kindPlural,
  REMINDER_KINDS,
} from '@/entities/session/lib/sessions';
import { getCompetition } from '@/shared/config/competitions';
import {
  iconSize,
  radius,
  sectionLabel,
  spacing,
  touchTarget,
  typography,
} from '@/shared/theme/designTokens';

const REMINDABLE = new Set(REMINDER_KINDS.map(({ kind }) => kind));

/** The session to watch now or next: live first, else the next scheduled. */
function highlighted(sessions: RaceSession[]): RaceSession | undefined {
  return (
    sessions.find((s) => s.status === 'live') ??
    sessions.find((s) => s.status === 'scheduled')
  );
}

/**
 * A race weekend: the session to watch now or next with its channels, then
 * every session by day. Each bell turns the reminder for that kind of
 * session on or off (every race, every qualifying), since Formula 1 has no
 * team to follow.
 */
export default function GrandPrixScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: sessions, isLoading } = useGrandPrix(id);
  const {
    supported: remindersSupported,
    enabled: remindersOn,
    setEnabled,
    exactAlarms,
    requestExactAlarms,
    sessionKinds,
    setSessionKind,
  } = useNotifications();

  const [first] = sessions ?? [];
  if (!sessions || !first) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Fórmula 1' }} />
        {!isLoading && <AppText tone="secondary">GP não encontrado</AppText>}
      </View>
    );
  }

  const next = highlighted(sessions);
  const competition = getCompetition(first.competition);

  const toggleKind = (session: RaceSession) => {
    const on = !(remindersOn && sessionKinds.includes(session.kind));
    setSessionKind(session.kind, on);
    // Asking for a reminder means wanting them: ask for the permission,
    // then for exact alarms (Android 14+), as the settings switch does.
    if (on && !remindersOn) {
      setEnabled(true)
        .then(async (granted) => {
          if (granted && !exactAlarms) {
            await promptExactAlarms(requestExactAlarms);
          }
        })
        .catch(() => {});
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ title: competition.name }} />

      <View style={styles.header}>
        <AppText
          accessibilityRole="header"
          variant="screenTitle"
          capped
          style={styles.title}
        >
          {first.grandPrix}
        </AppText>
        <AppText tone="secondary">
          {[first.circuit, formatWeekend(sessions)].filter(Boolean).join(' · ')}
        </AppText>
      </View>

      {next && (
        <View
          testID="next-session"
          style={[
            styles.next,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.primary,
            },
          ]}
        >
          <View style={styles.nextHead}>
            <AppText tone="accent" style={sectionLabel}>
              {next.status === 'live' ? 'Ao vivo agora' : 'Próxima sessão'}
            </AppText>
            <AppText variant="caption" tone="secondary">
              {formatDay(new Date(next.startsAt))}
            </AppText>
          </View>
          <View style={styles.nextWhat}>
            <AppText capped style={styles.nextTime}>
              {formatTime(next.startsAt)}
            </AppText>
            <AppText variant="label">{next.name}</AppText>
          </View>
          <ChannelButtons channels={next.channels} variant="secondary" />
        </View>
      )}

      {groupByDay(sessions).map(({ day, sessions: ofDay }) => (
        <View key={day}>
          <SectionHeader title={day} style={styles.dayHeader} />
          <Card style={styles.group}>
            {ofDay.map((session, index) => {
              const remindable =
                remindersSupported &&
                session.status === 'scheduled' &&
                REMINDABLE.has(session.kind);
              const ringing =
                remindersOn && sessionKinds.includes(session.kind);
              return (
                <View
                  key={session.id}
                  accessible
                  accessibilityLabel={describeSession(session)}
                  testID={`session-${session.id}`}
                  style={[
                    styles.row,
                    index > 0 && {
                      borderTopColor: colors.borderLight,
                      borderTopWidth: StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <AppText variant="labelStrong" capped style={styles.time}>
                    {formatTime(session.startsAt)}
                  </AppText>
                  <View style={styles.rowText}>
                    <AppText variant="label">{session.name}</AppText>
                    <AppText variant="caption" tone="secondary">
                      {session.status === 'live'
                        ? 'Ao vivo'
                        : session.status === 'finished'
                          ? 'Encerrada'
                          : session.channels.length > 0
                            ? session.channels.join(' · ')
                            : 'Transmissão a definir'}
                    </AppText>
                  </View>
                  {remindable && (
                    <TouchableOpacity
                      accessibilityRole="switch"
                      accessibilityState={{ checked: ringing }}
                      accessibilityLabel={`Avisar antes de ${kindPlural(session.kind)}`}
                      testID={`bell-${session.id}`}
                      style={styles.bell}
                      onPress={() => toggleKind(session)}
                    >
                      <Icon
                        name={ringing ? 'bell-ring' : 'bell-outline'}
                        size={iconSize.md}
                        color={ringing ? colors.primary : colors.textTertiary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </Card>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontWeight: typography.weight.heavy,
  },
  next: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  nextHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nextWhat: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  nextTime: {
    fontSize: typography.size.xxl + 4,
    fontWeight: typography.weight.heavy,
  },
  dayHeader: {
    paddingTop: spacing.xl,
  },
  group: {
    marginHorizontal: spacing.lg,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  time: {
    minWidth: 46,
  },
  rowText: {
    flex: 1,
    gap: 2,
    paddingVertical: spacing.sm,
  },
  bell: {
    alignItems: 'center',
    height: touchTarget,
    justifyContent: 'center',
    width: touchTarget,
  },
});
