import { StyleSheet, View } from 'react-native';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { SwitchRow } from '@/shared/ui/SwitchRow';
import { useNotifications } from '../model/NotificationsContext';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SessionKind } from '@/shared/api/snapshot';
import { promptExactAlarms } from '../lib/exactAlarmPrompt';
import { REMINDER_KINDS } from '@/entities/session/lib/sessions';
import { REMINDER_LEAD_MINUTES } from '../lib/reminders';

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
          <SwitchRow
            key={kind}
            label={label}
            detail={detail}
            value={enabled && sessionKinds.includes(kind)}
            onValueChange={(on) => toggle(kind, on)}
            accessibilityLabel={`Avisar antes de ${label}`}
            testID={`session-kind-${kind}`}
            style={[
              styles.row,
              index > 0 && {
                borderTopColor: colors.borderLight,
                borderTopWidth: StyleSheet.hairlineWidth,
              },
            ]}
          />
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
  },
});
