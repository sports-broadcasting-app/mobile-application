import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../contexts/ThemeContext';
import { sectionLabel, spacing } from '../constants/designTokens';

interface SectionHeaderProps {
  title: string;
  /** Drawn before the title, such as a star or a sport icon. */
  icon?: ReactNode | undefined;
  /** Shown after the title as "· 3 jogos". */
  detail?: string | undefined;
  /** Spacing around it; the default fits a full-width screen list. */
  style?: StyleProp<ViewStyle> | undefined;
  testID?: string | undefined;
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
      <AppText
        accessibilityRole="header"
        capped
        style={[sectionLabel, { color: colors.sectionHeaderText }]}
      >
        {title}
      </AppText>
      {detail !== undefined && (
        <AppText tone="tertiary" capped style={styles.detail}>
          · {detail}
        </AppText>
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
