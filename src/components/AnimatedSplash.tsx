import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import backLayer from '../../assets/splash-icon.png';
import frontLayer from '../../assets/splash/front.png';
import {
  SPLASH_BACKGROUND,
  SPLASH_FRONT_OFFSET,
  SPLASH_LOGO_SIZE,
} from '../constants/splash';

const LAYERS = 2;
// Starts anyway if an image never reports loading, so the app is never stuck.
const LOAD_TIMEOUT_MS = 1500;

// One timeline driven on the UI thread: a busy JS thread (data loading,
// first render) can't stall it between steps.
const TOTAL_MS = 1140;
const SLIDE_START = 120 / TOTAL_MS;
const SLIDE_END = 600 / TOTAL_MS;
const EXIT_START = 820 / TOTAL_MS;
const REDUCED_EXIT_MS = 200;

/**
 * Takes over from the native splash (the green play alone) with an identical
 * screen, slides the white play out from behind the green one, then opens
 * onto the app.
 */
export function AnimatedSplash({ children }: { children: ReactNode }) {
  const [done, setDone] = useState(false);
  const loaded = useRef(0);
  const started = useRef(false);
  const progress = useRef(new Animated.Value(0)).current;

  const start = useCallback(async () => {
    if (started.current) return;
    started.current = true;

    const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(
      () => false,
    );
    // The overlay now covers the screen exactly like the native splash.
    await SplashScreen.hideAsync().catch(() => undefined);

    // Reduced motion skips the slide: the full icon only fades out.
    if (reduceMotion) progress.setValue(EXIT_START);

    Animated.timing(progress, {
      toValue: 1,
      duration: reduceMotion ? REDUCED_EXIT_MS : TOTAL_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => setDone(true));
  }, [progress]);

  const front = progress.interpolate({
    inputRange: [0, SLIDE_START, SLIDE_END, 1],
    outputRange: [0, 0, 1, 1],
    easing: Easing.out(Easing.cubic),
  });
  const exit = progress.interpolate({
    inputRange: [0, EXIT_START, 1],
    outputRange: [0, 0, 1],
    easing: Easing.in(Easing.cubic),
  });

  useEffect(() => {
    const timeout = setTimeout(start, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [start]);

  const onLayerLoaded = () => {
    loaded.current += 1;
    if (loaded.current === LAYERS) start();
  };

  return (
    <View style={styles.root}>
      {children}
      {!done && (
        <Animated.View
          pointerEvents="none"
          testID="animated-splash"
          style={[
            StyleSheet.absoluteFill,
            styles.overlay,
            {
              opacity: exit.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            },
          ]}
        >
          <Animated.View
            style={[
              styles.logo,
              {
                transform: [
                  {
                    scale: exit.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.6],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={backLayer}
              style={styles.layer}
              testID="splash-back"
              onLoadEnd={onLayerLoaded}
            />
            <Animated.Image
              source={frontLayer}
              testID="splash-front"
              onLoadEnd={onLayerLoaded}
              style={[
                styles.layer,
                {
                  opacity: front,
                  transform: [
                    {
                      translateX: front.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-SPLASH_FRONT_OFFSET, 0],
                      }),
                    },
                  ],
                },
              ]}
            />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: SPLASH_BACKGROUND,
    justifyContent: 'center',
  },
  logo: {
    height: SPLASH_LOGO_SIZE,
    width: SPLASH_LOGO_SIZE,
  },
  layer: {
    height: SPLASH_LOGO_SIZE,
    position: 'absolute',
    width: SPLASH_LOGO_SIZE,
  },
});
