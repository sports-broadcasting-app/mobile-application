import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppearancePicker } from '../components/AppearancePicker';
import { ReminderToggle } from '../components/ReminderToggle';
import { TeamPicker } from '../components/TeamPicker';
import { useNotifications } from '../contexts/NotificationsContext';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography } from '../constants/designTokens';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { supported: notificationsSupported } = useNotifications();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Configurações
          </Text>
        </View>

        <Text
          style={[styles.sectionTitle, { color: colors.sectionHeaderText }]}
        >
          Aparência
        </Text>
        <AppearancePicker />

        {notificationsSupported && (
          <>
            <Text
              style={[styles.sectionTitle, { color: colors.sectionHeaderText }]}
            >
              Notificações
            </Text>
            <ReminderToggle />
          </>
        )}

        <Text
          style={[styles.sectionTitle, { color: colors.sectionHeaderText }]}
        >
          Time favorito
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Escolha um time por competição
        </Text>
        <TeamPicker />
      </ScrollView>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: typography.size.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
});
