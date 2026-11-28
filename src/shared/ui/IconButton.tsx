import {
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { iconSize, radius, touchTarget } from '@/shared/theme/designTokens';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  /** Says what it does: the icon alone says nothing to a screen reader. */
  accessibilityLabel: string;
  testID?: string;
  /** `chip` (36, outlined) sits in a chip row; `full` is a 44 pt button. */
  size?: 'chip' | 'full';
  style?: StyleProp<ViewStyle>;
}

/** A round button holding only an icon, such as "back". */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  testID,
  size = 'full',
  style,
}: IconButtonProps) {
  const { colors } = useTheme();
  const chip = size === 'chip';
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      // A chip is drawn at 36 pt; the slop brings its target to 44.
      hitSlop={chip ? 4 : undefined}
      style={[
        styles.button,
        chip ? styles.chip : styles.full,
        { backgroundColor: colors.surfaceAlt },
        chip && { borderColor: colors.controlBorder },
        style,
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        size={iconSize.md}
        color={colors.textPrimary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
  },
  chip: {
    borderWidth: 1,
    height: 36,
    width: 36,
  },
  full: {
    height: touchTarget,
    width: touchTarget,
  },
});
