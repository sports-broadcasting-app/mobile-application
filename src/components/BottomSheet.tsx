import { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, typography } from '../constants/designTokens';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Small line above the title, such as the competition. */
  eyebrow?: string;
  title: string;
  message?: string;
  /** Fills the space between the header and the footer; may scroll. */
  children: ReactNode;
  footer?: ReactNode;
  testID?: string;
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
  testID,
}: BottomSheetProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Fechar"
          style={[styles.backdrop, { backgroundColor: colors.overlayBg }]}
          onPress={onClose}
          testID={testID ? `${testID}-backdrop` : undefined}
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          testID={testID}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {eyebrow ? (
            <Text style={[styles.eyebrow, { color: colors.primary }]}>
              {eyebrow}
            </Text>
          ) : null}
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.textPrimary }]}
          >
            {title}
          </Text>
          {message ? (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          ) : null}
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
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
  eyebrow: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.heavy,
  },
  message: {
    fontSize: typography.size.body,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  body: {
    flexShrink: 1,
    marginTop: spacing.md,
  },
  footer: {
    marginTop: spacing.md,
  },
});
