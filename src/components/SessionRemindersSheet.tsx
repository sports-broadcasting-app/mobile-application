import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { ThemedSwitch } from './ThemedSwitch';
import { useNotifications } from '../contexts/NotificationsContext';
import { useTheme } from '../contexts/ThemeContext';
import { SessionKind } from '../types/snapshot';
import { promptExactAlarms } from '../utils/exactAlarmPrompt';
import { REMINDER_KINDS } from '../utils/sessions';
import { REMINDER_LEAD_MINUTES } from '../utils/reminders';
import { spacing, typography } from '../constants/designTokens';

interface SessionRemindersSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * "Avisos da Fórmula 1": Formula 1 has no team to follow, so reminders go
 * by kind of session (every race, every qualifying...). Turning one on
 * also turns the app's reminders on, asking for the permission.
 */
export function SessionRemindersSheet({
  visible,
  onClose,
}: SessionRemindersSheetProps) {
  const { colors } = useTheme();
  const {
    enabled,
    setEnabled,
    exactAlarms,
    requestExactAlarms,
    sessionKinds,
    setSessionKind,
  } = useNotifications();

  const toggle = (kind: SessionKind, on: boolean) => {
    setSessionKind(kind, on);
    if (on && !enabled) {
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
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Avisos da Fórmula 1"
      message={`${REMINDER_LEAD_MINUTES} minutos antes de cada sessão marcada, com o canal. A F1 não tem "seu time": você escolhe as sessões.`}
      testID="session-reminders-sheet"
      footer={
        <Button
          label="Pronto"
          testID="session-reminders-done"
          onPress={onClose}
        />
      }
    >
      <View>
        {REMINDER_KINDS.map(({ kind, label, detail }, index) => (
          <View
            key={kind}
            style={[
              styles.row,
              index > 0 && {
                borderTopColor: colors.borderLight,
                borderTopWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <View style={styles.text}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {label}
              </Text>
              <Text style={[styles.detail, { color: colors.textSecondary }]}>
                {detail}
              </Text>
            </View>
            <ThemedSwitch
              accessibilityLabel={`Avisar antes de ${label}`}
              testID={`session-kind-${kind}`}
              value={enabled && sessionKinds.includes(kind)}
              onValueChange={(on) => toggle(kind, on)}
            />
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 58,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  detail: {
    fontSize: typography.size.sm,
  },
});
