import { ReactNode, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, typography } from '../constants/designTokens';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Small line above the title, such as the competition. */
  eyebrow?: string | undefined;
  title: string;
  message?: string | undefined;
  /** Fills the space between the header and the footer; may scroll. */
  children: ReactNode;
  footer?: ReactNode | undefined;
  /**
   * Keeps the sheet at its full height instead of fitting the content, for
   * a list filtered by a search field: it would shrink under the keyboard.
   */
  fullHeight?: boolean;
  testID?: string;
}

/**
 * Height of the keyboard on Android. With edge-to-edge the window is not
 * resized, so the keyboard would cover the bottom of the sheet; iOS is
 * handled by KeyboardAvoidingView.
 */
function useAndroidKeyboardHeight(active: boolean) {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'android' || !active) return;
    const show = Keyboard.addListener('keyboardDidShow', (event) =>
      setHeight(event.endCoordinates.height),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
      setHeight(0);
    };
  }, [active]);
  return height;
}

/** A sheet from the bottom with a title, its content and a fixed footer. */
export function BottomSheet({
  visible,
  onClose,
  eyebrow,
  title,
  message,
  children,
  footer,
  fullHeight = false,
  testID,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const keyboardHeight = useAndroidKeyboardHeight(visible);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Lifts the sheet over the keyboard (padding on iOS, measured on Android). */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.root, { paddingBottom: keyboardHeight }]}
      >
        <Pressable
          accessibilityLabel="Fechar"
          style={[styles.backdrop, { backgroundColor: colors.overlayBg }]}
          onPress={onClose}
          testID={testID ? `${testID}-backdrop` : undefined}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            fullHeight && styles.fullHeight,
            { backgroundColor: colors.surface },
          ]}
          testID={testID}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {eyebrow ? (
            <AppText
              variant="captionStrong"
              tone="accent"
              style={styles.eyebrow}
            >
              {eyebrow}
            </AppText>
          ) : null}
          <AppText accessibilityRole="header" style={styles.title}>
            {title}
          </AppText>
          {message ? (
            <AppText variant="body" tone="secondary" style={styles.message}>
              {message}
            </AppText>
          ) : null}
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '88%',
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  fullHeight: {
    height: '88%',
  },
  handle: {
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.md,
    width: 40,
  },
  eyebrow: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.heavy,
  },
  message: {
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  body: {
    flexGrow: 1,
    flexShrink: 1,
    marginTop: spacing.md,
  },
  footer: {
    marginTop: spacing.md,
  },
});
