import { ReactNode, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing } from '../constants/designTokens';

interface SheetFrameProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** On the sheet; the backdrop gets `<testID>-backdrop`. */
  testID?: string | undefined;
  /** Layout inside the sheet, or a fixed height. */
  style?: StyleProp<ViewStyle>;
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

/**
 * What every sheet shares: the modal sliding from the bottom, the dim
 * backdrop that closes it, the rounded surface with its handle, and the lift
 * over the keyboard. The content is the caller's.
 */
export function SheetFrame({
  visible,
  onClose,
  children,
  testID,
  style,
}: SheetFrameProps) {
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
          style={[styles.sheet, { backgroundColor: colors.surface }, style]}
          testID={testID}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {children}
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
  handle: {
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.md,
    width: 40,
  },
});
