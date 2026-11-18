import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { maxFontScale, sectionLabel, spacing } from '../constants/designTokens';

interface SectionHeaderProps {
  title: string;
  /** Drawn before the title, such as a star or a sport icon. */
  icon?: ReactNode;
  /** Shown after the title as "· 3 jogos". */
  detail?: string;
  /** Spacing around it; the default fits a full-width screen list. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The uppercase label above a group of rows, the same on every screen. */
export function SectionHeader({
  title,
  icon,
  detail,
  style,
  testID,
}: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, style]} testID={testID}>
      {icon}
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={maxFontScale}
        style={[sectionLabel, { color: colors.sectionHeaderText }]}
      >
        {title}
      </Text>
      {detail !== undefined && (
        <Text
          maxFontSizeMultiplier={maxFontScale}
          style={[styles.detail, { color: colors.textTertiary }]}
        >
          · {detail}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  detail: {
    fontSize: sectionLabel.fontSize,
  },
});
