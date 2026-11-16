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
import { SportIcon } from '../components/SportIcon';
import { useCompetition } from '../contexts/CompetitionContext';
import { useTheme } from '../contexts/ThemeContext';
import { CompetitionSlug } from '../types/snapshot';
import { COMPETITIONS, getSport } from '../constants/competitions';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

interface OnboardingScreenProps {
  onFinish: () => void;
}

/**
 * First run: the competitions to follow. Teams and reminders live in the
 * settings, where the first team chosen offers the reminders.
 */
export default function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const { colors } = useTheme();
  const { setFollowed } = useCompetition();
  const [picked, setPicked] = useState<CompetitionSlug[]>([]);

  const toggle = (slug: CompetitionSlug) => {
    setPicked((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  };

  const start = () => {
    if (picked.length === 0) return;
    setFollowed(picked);
    onFinish();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          Bem-vindo ao Onde Passa
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.textPrimary }]}
        >
          O que você acompanha?
        </Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Escolha as competições que quer ver nos jogos e na classificação.
        </Text>

        <View style={styles.grid}>
          {COMPETITIONS.map((info) => {
            const on = picked.includes(info.slug);
            const sport = getSport(info.sport);
            return (
              <TouchableOpacity
                key={info.slug}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${info.name}, ${sport.name}`}
                testID={`onboarding-${info.slug}`}
                style={[
                  styles.tile,
                  {
                    backgroundColor: colors.surface,
                    borderColor: on ? colors.primary : colors.chipBorder,
                  },
                ]}
                onPress={() => toggle(info.slug)}
              >
                <View
                  style={[
                    styles.tileIcon,
                    {
                      backgroundColor: on ? colors.primary : colors.surfaceAlt,
                    },
                  ]}
                >
                  <SportIcon
                    sport={info.sport}
                    size={iconSize.lg}
                    color={on ? colors.textOnPrimary : colors.textSecondary}
                    filled={on}
                    knockoutColor={colors.primary}
                  />
                </View>
                <Text style={[styles.tileName, { color: colors.textPrimary }]}>
                  {info.name}
                </Text>
                <Text
                  style={[styles.tileSport, { color: colors.textSecondary }]}
                >
                  {sport.name}
                </Text>
                <View
                  style={[
                    styles.tick,
                    on
                      ? { backgroundColor: colors.primary }
                      : [styles.unchecked, { borderColor: colors.chipBorder }],
                  ]}
                >
                  {on ? (
                    <MaterialCommunityIcons
                      name="check"
                      size={iconSize.sm - 2}
                      color={colors.textOnPrimary}
                    />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.note, { color: colors.textTertiary }]}>
          Dá para mudar quando quiser. Seu time favorito e os avisos ficam em
          Configurações.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: picked.length === 0 }}
          disabled={picked.length === 0}
          testID="onboarding-start"
          style={[
            styles.button,
            {
              backgroundColor:
                picked.length === 0 ? colors.surfaceAlt : colors.primary,
            },
          ]}
          onPress={start}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color:
                  picked.length === 0
                    ? colors.textSecondary
                    : colors.textOnPrimary,
              },
            ]}
          >
            {picked.length === 0 ? 'Escolha pelo menos uma' : 'Começar'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  unchecked: {
    borderWidth: 2,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  eyebrow: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.heavy,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  text: {
    fontSize: typography.size.md,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  tile: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.sm,
    minHeight: 132,
    padding: spacing.lg,
  },
  tileIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  tileName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  tileSport: {
    fontSize: typography.size.sm,
  },
  tick: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    width: 22,
  },
  note: {
    fontSize: typography.size.sm,
    lineHeight: 18,
    marginTop: spacing.lg,
  },
  footer: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  button: {
    alignItems: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  buttonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
});
