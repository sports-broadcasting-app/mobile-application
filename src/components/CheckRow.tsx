import {
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppText, type TextVariant } from './AppText';
import { Checkbox } from './Checkbox';
import { spacing } from '../constants/designTokens';

interface CheckRowProps {
  label: string;
  /** Under the label, such as your team in that competition. */
  detail?: string | null;
  checked: boolean;
  /** Checked and the last one left: it cannot be unchecked. */
  locked?: boolean;
  onToggle: (next: boolean) => void;
  testID?: string;
  /** Height, indent and separators of the list it sits in. */
  style?: StyleProp<ViewStyle>;
  labelVariant?: TextVariant;
  /** Greys the label out while unchecked (the settings list). */
  dimUnchecked?: boolean;
  shape?: 'square' | 'round';
}

/** A competition to follow: its name and a checkbox, the whole row pressable. */
export function CheckRow({
  label,
  detail,
  checked,
  locked = false,
  onToggle,
  testID,
  style,
  labelVariant = 'label',
  dimUnchecked = false,
  shape = 'square',
}: CheckRowProps) {
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: locked }}
      accessibilityHint={
        locked ? 'Acompanhe outra antes de desmarcar esta' : undefined
      }
      testID={testID}
      style={[styles.row, style]}
      onPress={() => {
        if (!locked) onToggle(!checked);
      }}
    >
      <View style={styles.label}>
        <AppText
          variant={labelVariant}
          tone={dimUnchecked && !checked ? 'secondary' : 'primary'}
        >
          {label}
        </AppText>
        {detail ? (
          <AppText variant="caption" tone="secondary">
            {detail}
          </AppText>
        ) : null}
      </View>
      <Checkbox checked={checked} shape={shape} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    flex: 1,
    gap: 2,
  },
});
