import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { ThemeColors } from '@/shared/theme/theme';
import { maxFontScale, typography } from '@/shared/theme/designTokens';

const { size, weight } = typography;

/**
 * The text styles the app uses, named by role. One that fits none (the big
 * score, a screen title with its own spacing) takes the nearest variant and
 * adds its difference in `style`.
 */
const variants = {
  /** Dates, details, notes under a row. */
  caption: { fontSize: size.sm },
  captionMedium: { fontSize: size.sm, fontWeight: weight.medium },
  captionStrong: { fontSize: size.sm, fontWeight: weight.semibold },
  /** "sex 27 · 18:30" in front of a game or session. */
  meta: { fontSize: size.sm + 1, fontWeight: weight.medium },
  body: { fontSize: size.body },
  bodyStrong: { fontSize: size.body, fontWeight: weight.semibold },
  /** The teams or the session in a one-line row. */
  rowTitle: { fontSize: size.body + 1, fontWeight: weight.semibold },
  /** A row's name in a list or sheet. */
  label: { fontSize: size.md, fontWeight: weight.semibold },
  labelStrong: { fontSize: size.md, fontWeight: weight.bold },
  heading: { fontSize: size.lg, fontWeight: weight.bold },
  screenTitle: { fontSize: size.title, fontWeight: weight.bold },
  /** Pills and badges. */
  tiny: { fontSize: size.xs, fontWeight: weight.semibold },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof variants;

const tones = {
  primary: (c: ThemeColors) => c.textPrimary,
  secondary: (c: ThemeColors) => c.textSecondary,
  tertiary: (c: ThemeColors) => c.textTertiary,
  accent: (c: ThemeColors) => c.primary,
  onPrimary: (c: ThemeColors) => c.onPrimary,
  onLive: (c: ThemeColors) => c.onLive,
  error: (c: ThemeColors) => c.error,
  section: (c: ThemeColors) => c.sectionHeaderText,
};

/** `inherit`: text inside another text, which keeps the outer color. */
export type TextTone = keyof typeof tones | 'inherit';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /**
   * Caps system text scaling (`maxFontScale`): text in fixed-width columns,
   * one-line chips and screen titles.
   */
  capped?: boolean;
}

/** Every text of the app: a role, a theme color, and the scaling rule. */
export function AppText({
  variant = 'body',
  tone = 'primary',
  capped = false,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={capped ? maxFontScale : rest.maxFontSizeMultiplier}
      style={[
        variants[variant],
        tone !== 'inherit' && { color: tones[tone](colors) },
        style,
      ]}
    />
  );
}
