import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useCompetition } from '@/entities/competition/model/CompetitionContext';
import { useFavorites } from '@/entities/team/model/FavoritesContext';
import { useNotifications } from '../model/NotificationsContext';
import { AppText } from '@/shared/ui/AppText';
import { SwitchRow } from '@/shared/ui/SwitchRow';
import { promptExactAlarms } from '../lib/exactAlarmPrompt';
import { REMINDER_LEAD_MINUTES } from '../lib/reminders';
import { spacing } from '@/shared/theme/designTokens';

/** The in-app switch for the match reminders. */
export function ReminderToggle() {
  const { favorites } = useFavorites();
  const { enabled, setEnabled, exactAlarms, requestExactAlarms } =
    useNotifications();
  const { followed } = useCompetition();
  const hasFavorite = Object.keys(favorites).length > 0;
  const followsF1 = followed.includes('f1');
  const what = [
    hasFavorite ? 'dos jogos dos seus times' : null,
    followsF1 ? 'das sessões da F1 que você escolher' : null,
  ]
    .filter(Boolean)
    .join(' e ');

  const onChange = async (next: boolean) => {
    const done = await setEnabled(next);
    if (done) {
      if (next && !exactAlarms) await promptExactAlarms(requestExactAlarms);
      return;
    }
    Alert.alert(
      'Notificações bloqueadas',
      'Para receber os avisos, libere as notificações do Onde Passa nos ajustes do aparelho.',
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Abrir ajustes',
          onPress: () => {
            Linking.openSettings().catch(() => {});
          },
        },
      ],
    );
  };

  return (
    <View>
      <SwitchRow
        label="Avisar antes dos jogos"
        labelVariant="bodyStrong"
        detail={
          what
            ? `${REMINDER_LEAD_MINUTES} minutos antes ${what}, com o canal que transmite`
            : 'Escolha um time favorito abaixo para receber avisos'
        }
        value={enabled}
        onValueChange={onChange}
        accessibilityLabel="Avisar antes dos jogos"
        testID="reminder-switch"
        style={styles.row}
        textStyle={styles.text}
      />

      {enabled && !exactAlarms && (
        <TouchableOpacity
          accessibilityRole="button"
          testID="exact-alarms-notice"
          style={styles.notice}
          onPress={() => {
            requestExactAlarms().catch(() => {});
          }}
        >
          <AppText variant="caption" tone="secondary">
            Os avisos podem atrasar.{' '}
            <AppText variant="captionStrong" tone="accent">
              Permitir alarmes e lembretes
            </AppText>
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: {
    gap: spacing.xs,
  },
  notice: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
