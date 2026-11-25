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
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { useCompetition } from '../contexts/CompetitionContext';
import { useTheme } from '../contexts/ThemeContext';
import { CompetitionSlug, Sport } from '../types/snapshot';
import { COMPETITIONS, SPORTS } from '../constants/competitions';
import {
  iconSize,
  radius,
  spacing,
  touchTarget,
  typography,
} from '../constants/designTokens';

interface OnboardingScreenProps {
  onFinish: () => void;
}

const competitionsOf = (sport: Sport) =>
  COMPETITIONS.filter((info) => info.sport === sport);

/** "Superliga Masculina e Superliga Feminina": a sport's competitions. */
function listNames(sport: Sport): string {
  const names = competitionsOf(sport).map((info) => info.name);
  return names.length > 1
    ? `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
    : (names[0] ?? '');
}

/**
 * First run, in two steps: the sports, then their competitions, all marked
 * (a sport with a single competition needs no second look, so when every
 * pick is like that the second step is skipped). Teams and reminders live in
 * the settings, where the first team chosen offers the reminders.
 */
export default function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const { colors } = useTheme();
  const { setFollowed, markAllKnown } = useCompetition();
  const [sports, setSports] = useState<Sport[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [picked, setPicked] = useState<CompetitionSlug[]>([]);

  const toggleSport = (sport: Sport) => {
    setSports((current) =>
      current.includes(sport)
        ? current.filter((item) => item !== sport)
        : [...current, sport],
    );
  };

  const toggleCompetition = (slug: CompetitionSlug) => {
    setPicked((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  };

  const finish = (list: CompetitionSlug[]) => {
    if (list.length === 0) return;
    setFollowed(list);
    markAllKnown();
    onFinish();
  };

  const chosen = SPORTS.filter(({ sport }) => sports.includes(sport));
  const fromSports = COMPETITIONS.filter((info) =>
    sports.includes(info.sport),
  ).map((info) => info.slug);
  const needsStep2 = chosen.some(
    ({ sport }) => competitionsOf(sport).length > 1,
  );

  const next = () => {
    if (sports.length === 0) return;
    if (!needsStep2) {
      finish(fromSports);
      return;
    }
    setPicked(fromSports);
    setStep(2);
  };

  const tick = (on: boolean) => (
    <View
      style={[
        styles.tick,
        on
          ? { backgroundColor: colors.primary }
          : [styles.unchecked, { borderColor: colors.controlBorder }],
      ]}
    >
      {on ? (
        <MaterialCommunityIcons
          name="check"
          size={iconSize.sm - 2}
          color={colors.onPrimary}
        />
      ) : null}
    </View>
  );

  const steps = (
    <View
      style={styles.steps}
      accessible
      accessibilityLabel={`Passo ${step} de 2`}
    >
      {[1, 2].map((n) => (
        <View
          key={n}
          style={[
            styles.step,
            {
              backgroundColor: n <= step ? colors.primary : colors.surfaceAlt,
            },
          ]}
        />
      ))}
    </View>
  );

  if (step === 2) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.backRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Voltar para os esportes"
              testID="onboarding-back"
              style={[styles.back, { backgroundColor: colors.surfaceAlt }]}
              onPress={() => setStep(1)}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={iconSize.md}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            <View style={styles.stepsBeside}>{steps}</View>
          </View>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.textPrimary }]}
          >
            E as competições?
          </Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            Já vêm todas marcadas. Desmarque o que não quer ver.
          </Text>

          {chosen.map(({ sport, name }) => (
            <View key={sport}>
              <SectionHeader
                title={name}
                style={styles.group}
                icon={
                  <SportIcon
                    sport={sport}
                    size={iconSize.sm}
                    color={colors.sectionHeaderText}
                  />
                }
              />
              <View style={[styles.box, { backgroundColor: colors.surface }]}>
                {competitionsOf(sport).map((info, index) => {
                  const on = picked.includes(info.slug);
                  return (
                    <TouchableOpacity
                      key={info.slug}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      testID={`onboarding-${info.slug}`}
                      style={[
                        styles.item,
                        index > 0 && {
                          borderTopColor: colors.borderLight,
                          borderTopWidth: StyleSheet.hairlineWidth,
                        },
                      ]}
                      onPress={() => toggleCompetition(info.slug)}
                    >
                      <Text
                        style={[styles.itemName, { color: colors.textPrimary }]}
                      >
                        {info.name}
                      </Text>
                      <View style={styles.itemTick}>{tick(on)}</View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <Text style={[styles.note, { color: colors.textTertiary }]}>
            Quando o app ganhar uma competição destes esportes, ela já entra.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={picked.length === 0 ? 'Escolha pelo menos uma' : 'Começar'}
            disabled={picked.length === 0}
            testID="onboarding-start"
            onPress={() => finish(picked)}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {steps}
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          Bem-vindo ao Onde Passa
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.textPrimary }]}
        >
          Quais esportes você acompanha?
        </Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Depois você escolhe as competições de cada um.
        </Text>

        <View style={styles.grid}>
          {SPORTS.map(({ sport, name }) => {
            const on = sports.includes(sport);
            const competitions = listNames(sport);
            if (!competitions) return null;
            return (
              <TouchableOpacity
                key={sport}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${name}: ${competitions}`}
                testID={`onboarding-sport-${sport}`}
                style={[
                  styles.tile,
                  {
                    backgroundColor: colors.surface,
                    borderColor: on ? colors.primary : colors.controlBorder,
                  },
                ]}
                onPress={() => toggleSport(sport)}
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
                    sport={sport}
                    size={iconSize.lg}
                    color={on ? colors.onPrimary : colors.textSecondary}
                    filled={on}
                    knockoutColor={colors.primary}
                  />
                </View>
                <Text style={[styles.tileName, { color: colors.textPrimary }]}>
                  {name}
                </Text>
                <Text
                  style={[styles.tileSport, { color: colors.textSecondary }]}
                >
                  {competitions}
                </Text>
                <View style={styles.tileTick}>{tick(on)}</View>
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
        <Button
          label={
            sports.length === 0
              ? 'Escolha pelo menos um'
              : needsStep2
                ? 'Continuar'
                : 'Começar'
          }
          disabled={sports.length === 0}
          testID="onboarding-next"
          onPress={next}
        />
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
    // An odd last tile keeps the size of the others instead of the full row.
    maxWidth: '48.5%',
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
    width: 22,
  },
  tileTick: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
  },
  steps: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginBottom: spacing.lg,
  },
  step: {
    borderRadius: 3,
    flex: 1,
    height: 5,
  },
  stepsBeside: {
    flex: 1,
  },
  backRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  back: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: touchTarget,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: touchTarget,
  },
  group: {
    paddingHorizontal: 0,
    paddingTop: spacing.xl,
  },
  box: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  itemName: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  itemTick: {
    alignItems: 'center',
    justifyContent: 'center',
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
});
