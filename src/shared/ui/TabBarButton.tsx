import {
  Image,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type ImageSourcePropType,
} from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { radius, spacing } from '@/shared/theme/designTokens';
import { AppText } from './AppText';

/** Side of the tab glyph: the 24 pt template icons drawn a bit larger. */
export const TAB_ICON_SIZE = 26;
/** Height of a tab inside the bar; also the width of an inactive one. */
export const TAB_HEIGHT = 52;

type PressHandler = ((event: GestureResponderEvent) => void) | null | undefined;

type Props = {
  label: string;
  icon: ImageSourcePropType;
  selectedIcon: ImageSourcePropType;
  /** Filled in by `TabTrigger asChild`. */
  isFocused?: boolean | undefined;
  onPress?: PressHandler;
  onLongPress?: PressHandler;
  testID?: string | undefined;
};

/**
 * One tab of the glass bar: the icon alone, or icon and name on the active
 * tab, over a `primarySoft` lens. The name is always the accessibility label.
 */
export function TabBarButton({
  label,
  icon,
  selectedIcon,
  isFocused = false,
  onPress,
  onLongPress,
  testID,
}: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      testID={testID}
      onPress={(event) => {
        // The tab that gets the name grows while the old one shrinks.
        if (!isFocused) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        onPress?.(event);
      }}
      onLongPress={onLongPress ?? undefined}
      style={({ pressed }) => [
        styles.tab,
        !isFocused && styles.inactive,
        isFocused && [styles.active, { backgroundColor: colors.primarySoft }],
        pressed && !isFocused && { backgroundColor: colors.surfaceAlt },
      ]}
    >
      <Image
        source={isFocused ? selectedIcon : icon}
        // Template glyphs (black on transparent), tinted by the theme.
        style={[
          styles.icon,
          { tintColor: isFocused ? colors.primary : colors.controlText },
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      {isFocused && (
        <AppText variant="bodyStrong" tone="accent" capped numberOfLines={1}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    height: TAB_HEIGHT,
    minWidth: TAB_HEIGHT + spacing.sm,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  inactive: {
    flex: 1,
  },
  active: {
    flexShrink: 0,
    paddingHorizontal: spacing.lg + 2,
  },
  icon: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
  },
});
