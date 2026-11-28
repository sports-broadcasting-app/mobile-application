import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText, type TextTone, type TextVariant } from './AppText';
import { ThemedSwitch } from './ThemedSwitch';
import { spacing } from '@/shared/theme/designTokens';

interface SwitchRowProps {
  label: string;
  /** Under the label: what the switch does, or what it covers. */
  detail?: string | null | undefined;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
  /** On the switch, where tests and screen readers act. */
  testID?: string | undefined;
  /** Before the label, such as a sport icon. */
  leading?: ReactNode | undefined;
  labelVariant?: TextVariant;
  labelTone?: TextTone;
  /** Height and padding of the list it sits in. */
  style?: StyleProp<ViewStyle>;
  /** Spacing between label and detail. */
  textStyle?: StyleProp<ViewStyle>;
}

/** A label with a switch at the end: every on/off setting of the app. */
export function SwitchRow({
  label,
  detail,
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  testID,
  leading,
  labelVariant = 'label',
  labelTone = 'primary',
  style,
  textStyle,
}: SwitchRowProps) {
  return (
    <View style={[styles.row, style]}>
      {leading}
      <View style={[styles.text, textStyle]}>
        <AppText variant={labelVariant} tone={labelTone}>
          {label}
        </AppText>
        {detail ? (
          <AppText variant="caption" tone="secondary">
            {detail}
          </AppText>
        ) : null}
      </View>
      <ThemedSwitch
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
