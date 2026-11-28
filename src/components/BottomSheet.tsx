import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { SheetFrame } from './SheetFrame';
import { spacing, typography } from '../constants/designTokens';

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
  return (
    <SheetFrame
      visible={visible}
      onClose={onClose}
      testID={testID}
      style={fullHeight && styles.fullHeight}
    >
      {eyebrow ? (
        <AppText variant="captionStrong" tone="accent" style={styles.eyebrow}>
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
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  fullHeight: {
    height: '88%',
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
