import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { CompetitionSlug } from '../types/snapshot';
import { getCompetition } from '../constants/competitions';
import { Button } from './Button';
import { SportIcon } from './SportIcon';
import {
  iconSize,
  radius,
  sectionLabel,
  spacing,
  typography,
} from '../constants/designTokens';

interface NewsCardProps {
  competition: CompetitionSlug;
  /** One line on what is coming ("O próximo é o GP do Catar, de 27 a 29/11."). */
  next?: string;
  onFollow: () => void;
  onDismiss: () => void;
}

/** What a new competition offers, so it reaches people who set up the app before it existed. */
const DESCRIPTIONS: Partial<Record<CompetitionSlug, string>> = {
  f1: 'Treinos, classificação e corrida, com o horário e onde passa.',
};

/**
 * Offers, once, a competition this install had never seen and whose sport
 * the user does not follow (Formula 1 for everyone who set up the app
 * before 1.5): it is never switched on without asking.
 */
export function NewsCard({
  competition,
  next,
  onFollow,
  onDismiss,
}: NewsCardProps) {
  const { colors } = useTheme();
  const info = getCompetition(competition);
  const description = DESCRIPTIONS[competition];

  return (
    <View
      testID={`news-${competition}`}
      style={[
        styles.card,
        { backgroundColor: colors.primarySoft, borderColor: colors.primary },
      ]}
    >
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: colors.surface }]}>
          <SportIcon
            sport={info.sport}
            size={iconSize.lg}
            color={colors.primary}
          />
        </View>
        <View style={styles.title}>
          <Text style={[sectionLabel, { color: colors.primary }]}>
            Novidade
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.name, { color: colors.textPrimary }]}
          >
            {`Agora tem ${info.name}`}
          </Text>
        </View>
      </View>
      {description || next ? (
        <Text style={[styles.text, { color: colors.textPrimary }]}>
          {[description, next].filter(Boolean).join(' ')}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button
          label="Acompanhar"
          testID={`news-follow-${competition}`}
          style={styles.action}
          onPress={onFollow}
        />
        <Button
          label="Agora não"
          variant="secondary"
          testID={`news-dismiss-${competition}`}
          style={styles.action}
          onPress={onDismiss}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  head: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  icon: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  title: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  text: {
    fontSize: typography.size.body,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
