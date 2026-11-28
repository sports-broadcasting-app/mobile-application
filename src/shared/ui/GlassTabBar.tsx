import type { ComponentRef, ReactNode, RefObject } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shadows, spacing } from '@/shared/theme/designTokens';
import { GlassSurface } from './GlassSurface';
import { TAB_HEIGHT } from './TabBarButton';

const PADDING = spacing.xs + 2;
/** Height of the floating capsule. */
export const TAB_BAR_HEIGHT = TAB_HEIGHT + PADDING * 2;

/**
 * Gap between the capsule and the bottom edge: it sits a little into the
 * home indicator / gesture bar inset, never closer than `spacing.md`.
 */
export function tabBarBottom(bottomInset: number): number {
  return Math.max(bottomInset - spacing.sm, spacing.md);
}

/**
 * Space a tab screen leaves at the end of its scroll content so the last row
 * clears the floating bar. Content still scrolls under the glass.
 */
export function useTabBarSpace(): number {
  const { bottom } = useSafeAreaInsets();
  return tabBarBottom(bottom) + TAB_BAR_HEIGHT + spacing.lg;
}

type Props = {
  /** `TabTrigger`s with a `TabBarButton` each. */
  children?: ReactNode;
  /** Filled in by `TabList asChild` (row layout). */
  style?: StyleProp<ViewStyle>;
  blurTarget?: RefObject<ComponentRef<typeof View> | null> | undefined;
};

/**
 * The floating glass bar of the tabs, the width of the screen less 20 pt on
 * each side, the same on iOS and Android. The active tab takes the width of
 * its icon and name; the others share the rest.
 */
export function GlassTabBar({ children, style, blurTarget }: Props) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.dock, { bottom: tabBarBottom(bottom) }]}
    >
      <View style={styles.shadow}>
        <GlassSurface blurTarget={blurTarget} style={styles.capsule}>
          <View accessibilityRole="tablist" style={[style, styles.row]}>
            {children}
          </View>
        </GlassSurface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
  },
  shadow: {
    ...shadows.lg,
    // Elevation on a translucent view draws a dark slab on Android.
    elevation: 0,
    borderRadius: TAB_BAR_HEIGHT / 2,
  },
  capsule: {
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    padding: PADDING,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
