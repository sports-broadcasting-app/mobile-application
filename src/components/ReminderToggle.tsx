import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useTheme } from '../contexts/ThemeContext';
import { REMINDER_LEAD_MINUTES } from '../utils/reminders';
import { spacing, typography } from '../constants/designTokens';

/** The in-app switch for the match reminders. */
export function ReminderToggle() {
  const { colors } = useTheme();
  const { favorites } = useFavorites();
  const { enabled, setEnabled } = useNotifications();
  const hasFavorite = Object.keys(favorites).length > 0;

  const onChange = async (next: boolean) => {
    const done = await setEnabled(next);
    if (done) return;
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
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          Avisar antes dos jogos
        </Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {hasFavorite
            ? `${REMINDER_LEAD_MINUTES} minutos antes dos jogos dos seus times, com o canal que transmite`
            : 'Escolha um time favorito abaixo para receber avisos'}
        </Text>
      </View>
      <Switch
        accessibilityLabel="Avisar antes dos jogos"
        testID="reminder-switch"
        value={enabled}
        onValueChange={onChange}
        trackColor={{ true: colors.primary }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  hint: {
    fontSize: typography.size.sm,
  },
});
