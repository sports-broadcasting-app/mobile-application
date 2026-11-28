import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { Icon } from './Icon';
import type { IconName } from './icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import {
  iconSize,
  radius,
  spacing,
  touchTarget,
  typography,
} from '@/shared/theme/designTokens';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  /**
   * primary: the one main action (filled). secondary: an alternative
   * (outlined). plain: dismissals such as "Cancelar" (text only).
   */
  variant?: 'primary' | 'secondary' | 'plain';
  icon?: IconName | undefined;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The app's button: one height, radius and press feedback everywhere. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  style,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();

  const fill =
    variant === 'primary'
      ? { backgroundColor: disabled ? colors.surfaceAlt : colors.primary }
      : variant === 'secondary'
        ? { borderColor: colors.border, borderWidth: 1 }
        : null;
  const textColor = disabled
    ? colors.textSecondary
    : variant === 'primary'
      ? colors.onPrimary
      : variant === 'secondary'
        ? colors.textPrimary
        : colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        fill,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon && <Icon name={icon} size={iconSize.md} color={textColor} />}
      <AppText
        style={[
          styles.label,
          variant === 'primary' ? styles.strong : styles.regular,
          { color: textColor },
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: touchTarget + spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontSize: typography.size.md,
    textAlign: 'center',
  },
  strong: {
    fontWeight: typography.weight.bold,
  },
  regular: {
    fontWeight: typography.weight.semibold,
  },
});
