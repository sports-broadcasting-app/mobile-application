import { Alert } from 'react-native';
import { REMINDER_LEAD_MINUTES } from './reminders';

/**
 * Explains why exact alarms matter before opening the system screen, where
 * Android 14+ shows only a bare switch. Resolves once the user decided.
 */
export function promptExactAlarms(
  requestExactAlarms: () => Promise<boolean>,
): Promise<void> {
  return new Promise((resolve) => {
    Alert.alert(
      'Avisos na hora certa',
      `Para o aviso chegar ${REMINDER_LEAD_MINUTES} minutos antes do jogo, permita "Alarmes e lembretes" para o Onde Passa. Sem isso, o Android pode atrasar o aviso.`,
      [
        { text: 'Agora não', style: 'cancel', onPress: () => resolve() },
        {
          text: 'Permitir',
          onPress: () => {
            requestExactAlarms()
              .catch(() => false)
              .finally(() => resolve());
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve() },
    );
  });
}
