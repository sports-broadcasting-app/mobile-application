import type { ComponentRef, ReactNode, RefObject } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useTheme } from '@/shared/theme/ThemeContext';

/** The material behind a glass surface on this device. */
export type GlassMaterial = 'liquid-glass' | 'blur' | 'solid';

/** Android blurs with RenderEffect from API 31; below it the blur is too slow. */
const ANDROID_BLUR_API = 31;

export function glassMaterial(): GlassMaterial {
  if (Platform.OS === 'ios') {
    return isLiquidGlassAvailable() ? 'liquid-glass' : 'blur';
  }
  if (Platform.OS === 'android') {
    return typeof Platform.Version === 'number' &&
      Platform.Version >= ANDROID_BLUR_API
      ? 'blur'
      : 'solid';
  }
  return 'blur';
}

type Props = {
  style?: StyleProp<ViewStyle>;
  /**
   * Android only: the view whose content shows blurred through the glass (a
   * `BlurTargetView` around the screens). iOS blurs whatever is behind.
   */
  blurTarget?: RefObject<ComponentRef<typeof View> | null> | undefined;
  children?: ReactNode;
};

/**
 * A translucent surface that looks the same on both platforms: Liquid Glass
 * on iOS 26, a blur with the theme's `glass` fill on older iOS and Android 12+,
 * and the plain `surface` color where blurring would be too slow.
 */
export function GlassSurface({ style, blurTarget, children }: Props) {
  const { colors, isDark } = useTheme();
  const material = glassMaterial();
  const frame = [styles.frame, { borderColor: colors.glassBorder }, style];

  if (material === 'liquid-glass') {
    return (
      <GlassView
        testID="glass-surface"
        glassEffectStyle="regular"
        // Follows the in-app theme, which may differ from the system one.
        colorScheme={isDark ? 'dark' : 'light'}
        isInteractive
        style={frame}
      >
        {children}
      </GlassView>
    );
  }

  if (material === 'solid') {
    return (
      <View
        testID="glass-surface"
        style={[frame, { backgroundColor: colors.surface }]}
      >
        {children}
      </View>
    );
  }

  return (
    <View testID="glass-surface" style={frame}>
      <BlurView
        intensity={60}
        tint={isDark ? 'dark' : 'light'}
        blurMethod="dimezisBlurViewSdk31Plus"
        {...(blurTarget ? { blurTarget } : {})}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
