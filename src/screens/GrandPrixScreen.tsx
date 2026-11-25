import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { useNotifications } from '../contexts/NotificationsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useGrandPrix } from '../hooks/useSuperliga';
import { RaceSession } from '../types/snapshot';
import { getChannelUrl } from '../utils/broadcast';
import { promptExactAlarms } from '../utils/exactAlarmPrompt';
import { formatDay, formatTime } from '../utils/date';
import {
  describeSession,
  formatWeekend,
  groupByDay,
  kindPlural,
  REMINDER_KINDS,
} from '../utils/sessions';
import { getCompetition } from '../constants/competitions';
import {
  iconSize,
  maxFontScale,
  radius,
  sectionLabel,
  spacing,
  touchTarget,
  typography,
} from '../constants/designTokens';

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

  if (!sessions || sessions.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Fórmula 1' }} />
        {!isLoading && (
          <Text style={{ color: colors.textSecondary }}>GP não encontrado</Text>
        )}
      </View>
    );
  }

  const [first] = sessions;
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
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={maxFontScale}
          style={[styles.title, { color: colors.textPrimary }]}
        >
          {first.grandPrix}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {[first.circuit, formatWeekend(sessions)].filter(Boolean).join(' · ')}
        </Text>
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
            <Text style={[sectionLabel, { color: colors.primary }]}>
              {next.status === 'live' ? 'Ao vivo agora' : 'Próxima sessão'}
            </Text>
            <Text style={[styles.nextDay, { color: colors.textSecondary }]}>
              {formatDay(new Date(next.startsAt))}
            </Text>
          </View>
          <View style={styles.nextWhat}>
            <Text
              maxFontSizeMultiplier={maxFontScale}
              style={[styles.nextTime, { color: colors.textPrimary }]}
            >
              {formatTime(next.startsAt)}
            </Text>
            <Text style={[styles.nextName, { color: colors.textPrimary }]}>
              {next.name}
            </Text>
          </View>
          {next.channels.length === 0 ? (
            <Text style={[styles.tbd, { color: colors.textSecondary }]}>
              Transmissão a definir
            </Text>
          ) : (
            next.channels.map((channel) => {
              const url = getChannelUrl(channel);
              return (
                <Button
                  key={channel}
                  variant="secondary"
                  icon="play"
                  label={url ? `Assistir no ${channel}` : channel}
                  disabled={!url}
                  onPress={() => {
                    if (url) Linking.openURL(url).catch(() => {});
                  }}
                />
              );
            })
          )}
        </View>
      )}

      {groupByDay(sessions).map(({ day, sessions: ofDay }) => (
        <View key={day}>
          <SectionHeader title={day} style={styles.dayHeader} />
          <View style={[styles.group, { backgroundColor: colors.surface }]}>
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
                  <Text
                    maxFontSizeMultiplier={maxFontScale}
                    style={[styles.time, { color: colors.textPrimary }]}
                  >
                    {formatTime(session.startsAt)}
                  </Text>
                  <View style={styles.rowText}>
                    <Text
                      style={[styles.rowName, { color: colors.textPrimary }]}
                    >
                      {session.name}
                    </Text>
                    <Text
                      style={[
                        styles.rowDetail,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {session.status === 'live'
                        ? 'Ao vivo'
                        : session.status === 'finished'
                          ? 'Encerrada'
                          : session.channels.length > 0
                            ? session.channels.join(' · ')
                            : 'Transmissão a definir'}
                    </Text>
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
                      <MaterialCommunityIcons
                        name={ringing ? 'bell-ring' : 'bell-outline'}
                        size={iconSize.md}
                        color={ringing ? colors.primary : colors.textTertiary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
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
    fontSize: typography.size.title,
    fontWeight: typography.weight.heavy,
  },
  subtitle: {
    fontSize: typography.size.body,
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
  nextDay: {
    fontSize: typography.size.sm,
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
  nextName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  tbd: {
    fontSize: typography.size.body,
  },
  dayHeader: {
    paddingTop: spacing.xl,
  },
  group: {
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
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
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    minWidth: 46,
  },
  rowText: {
    flex: 1,
    gap: 2,
    paddingVertical: spacing.sm,
  },
  rowName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  rowDetail: {
    fontSize: typography.size.sm,
  },
  bell: {
    alignItems: 'center',
    height: touchTarget,
    justifyContent: 'center',
    width: touchTarget,
  },
});
