import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SportIcon } from '../components/SportIcon';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Checkbox } from '../components/Checkbox';
import { CheckRow } from '../components/CheckRow';
import { IconButton } from '../components/IconButton';
import { IconTile } from '../components/IconTile';
import { SectionHeader } from '../components/SectionHeader';
import { useCompetition } from '../contexts/CompetitionContext';
import { useTheme } from '../contexts/ThemeContext';
import { CompetitionSlug, Sport } from '../types/snapshot';
import { COMPETITIONS, SPORTS } from '../constants/competitions';
import {
  iconSize,
  radius,
  spacing,
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
            <IconButton
              icon="chevron-left"
              accessibilityLabel="Voltar para os esportes"
              testID="onboarding-back"
              style={styles.back}
              onPress={() => setStep(1)}
            />
            <View style={styles.stepsBeside}>{steps}</View>
          </View>
          <AppText accessibilityRole="header" style={styles.title}>
            E as competições?
          </AppText>
          <AppText tone="secondary" style={styles.text}>
            Já vêm todas marcadas. Desmarque o que não quer ver.
          </AppText>

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
              <Card>
                {competitionsOf(sport).map((info, index) => (
                  <CheckRow
                    key={info.slug}
                    label={info.name}
                    checked={picked.includes(info.slug)}
                    onToggle={() => toggleCompetition(info.slug)}
                    testID={`onboarding-${info.slug}`}
                    shape="round"
                    style={[
                      styles.item,
                      index > 0 && {
                        borderTopColor: colors.borderLight,
                        borderTopWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  />
                ))}
              </Card>
            </View>
          ))}

          <AppText variant="caption" tone="tertiary" style={styles.note}>
            Quando o app ganhar uma competição destes esportes, ela já entra.
          </AppText>
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
        <AppText variant="bodyStrong" tone="accent">
          Bem-vindo ao Onde Passa
        </AppText>
        <AppText accessibilityRole="header" style={styles.title}>
          Quais esportes você acompanha?
        </AppText>
        <AppText tone="secondary" style={styles.text}>
          Depois você escolhe as competições de cada um.
        </AppText>

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
                <IconTile size={40} active={on}>
                  <SportIcon
                    sport={sport}
                    size={iconSize.lg}
                    color={on ? colors.onPrimary : colors.textSecondary}
                    filled={on}
                    knockoutColor={colors.primary}
                  />
                </IconTile>
                <AppText variant="labelStrong">{name}</AppText>
                <AppText variant="caption" tone="secondary">
                  {competitions}
                </AppText>
                <View style={styles.tileTick}>
                  <Checkbox checked={on} shape="round" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <AppText variant="caption" tone="tertiary" style={styles.note}>
          Dá para mudar quando quiser. Seu time favorito e os avisos ficam em
          Configurações.
        </AppText>
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
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
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
    marginBottom: spacing.lg,
  },
  group: {
    paddingHorizontal: 0,
    paddingTop: spacing.xl,
  },
  item: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  note: {
    lineHeight: 18,
    marginTop: spacing.lg,
  },
  footer: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
});
