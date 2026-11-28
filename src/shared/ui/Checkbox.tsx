import { StyleSheet, View } from 'react-native';
import { Icon } from './Icon';
import { useTheme } from '@/shared/theme/ThemeContext';
import { iconSize, radius } from '@/shared/theme/designTokens';

interface CheckboxProps {
  checked: boolean;
  /** `square` in lists; `round` on the onboarding tiles. */
  shape?: 'square' | 'round';
}

/** The box of a checkbox row; the row itself handles the press. */
export function Checkbox({ checked, shape = 'square' }: CheckboxProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.box,
        shape === 'round' ? styles.round : styles.square,
        checked
          ? { backgroundColor: colors.primary }
          : [styles.unchecked, { borderColor: colors.controlBorder }],
      ]}
    >
      {checked ? (
        <Icon
          name="check"
          size={shape === 'round' ? iconSize.sm - 2 : iconSize.sm}
          color={colors.onPrimary}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  square: {
    borderRadius: 7,
    height: 24,
    width: 24,
  },
  round: {
    borderRadius: radius.pill,
    height: 22,
    width: 22,
  },
  unchecked: {
    borderWidth: 2,
  },
});
