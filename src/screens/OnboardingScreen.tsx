import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TeamPicker } from '../components/TeamPicker';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTeamsById } from '../hooks/useSuperliga';
import { getTeamName } from '../utils/teamName';
import { REMINDER_LEAD_MINUTES } from '../utils/reminders';
import { radius, spacing, typography } from '../constants/designTokens';

type Step = 'teams' | 'reminders';

/** "Flamengo", "Flamengo e Minas", "Flamengo, Minas e Cruzeiro". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

interface OnboardingScreenProps {
  onFinish: () => void;
}

/** First run: pick the favorite teams, then opt in to the match reminders. */
export default function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const { colors } = useTheme();
  const { favorites } = useFavorites();
  const { supported, setEnabled } = useNotifications();
  const teamsById = useTeamsById();
  const [step, setStep] = useState<Step>('teams');
  const [busy, setBusy] = useState(false);

  const favoriteNames = Object.values(favorites)
    .map((id) => (id ? teamsById.get(id) : undefined))
    .filter((team) => team !== undefined)
    .map((team) => getTeamName(team.name));
  const hasFavorite = favoriteNames.length > 0;

  const continueFromTeams = () => {
    // Reminders follow the favorites: without one there is nothing to offer.
    if (hasFavorite && supported) setStep('reminders');
    else onFinish();
  };

  const enableReminders = async () => {
    setBusy(true);
    try {
      await setEnabled(true);
    } finally {
      setBusy(false);
      onFinish();
    }
  };

  if (step === 'reminders') {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.reminders}>
          <View
            style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}
          >
            <MaterialCommunityIcons
              name="bell-ring-outline"
              size={56}
              color={colors.primary}
            />
          </View>
          <Text
            style={[
              styles.title,
              styles.centered,
              { color: colors.textPrimary },
            ]}
          >
            Não perca o jogo do seu time
          </Text>
          <Text
            style={[
              styles.text,
              styles.centered,
              { color: colors.textSecondary },
            ]}
          >
            {`Avisamos ${REMINDER_LEAD_MINUTES} minutos antes dos jogos de ${joinNames(favoriteNames)}, com o canal que vai transmitir. Dá para desligar quando quiser em Configurações.`}
          </Text>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy}
            testID="onboarding-enable-reminders"
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={enableReminders}
          >
            <Text
              style={[
                styles.primaryButtonText,
                { color: colors.textOnPrimary },
              ]}
            >
              Ativar avisos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy}
            testID="onboarding-skip-reminders"
            style={styles.secondaryButton}
            onPress={onFinish}
          >
            <Text
              style={[styles.secondaryButtonText, { color: colors.primary }]}
            >
              Agora não
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Bem-vindo ao Onde Passa
          </Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            Escolha seus times. Os jogos deles aparecem primeiro e você sabe
            onde assistir a cada um.
          </Text>
        </View>
        <TeamPicker />
      </ScrollView>
      <View
        style={[
          styles.footer,
          styles.footerDivider,
          { borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          testID="onboarding-continue"
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={continueFromTeams}
        >
          <Text
            style={[styles.primaryButtonText, { color: colors.textOnPrimary }]}
          >
            {hasFavorite ? 'Continuar' : 'Pular por enquanto'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  header: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.heavy,
    letterSpacing: -0.5,
  },
  text: {
    fontSize: typography.size.md,
    lineHeight: 22,
  },
  centered: {
    textAlign: 'center',
  },
  reminders: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 112,
    justifyContent: 'center',
    width: 112,
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  footerDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  primaryButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
});
