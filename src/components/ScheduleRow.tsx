import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { AppText } from './AppText';
import { BroadcasterPill } from './BroadcasterPill';
import { iconSize, spacing } from '../constants/designTokens';

interface ScheduleRowProps {
  /** "sex 27 · 18:30". */
  when: string;
  /** The clubs, or the Grand Prix and the session. */
  title: string;
  /** A session name may need a second line; clubs stay on one. */
  titleLines?: 1 | 2;
  favorite?: boolean | undefined;
  /** The first channel; none shows "a definir" when `showTbd`. */
  channel?: string | undefined;
  showTbd?: boolean;
  onPress?: (() => void) | undefined;
  accessibilityLabel: string;
  accessibilityHint?: string | undefined;
  testID: string;
}

/** Something coming, in one line: when, what, the first channel. */
export function ScheduleRow({
  when,
  title,
  titleLines = 1,
  favorite = false,
  channel,
  showTbd = true,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ScheduleRowProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={onPress ? accessibilityHint : undefined}
      testID={testID}
      style={[styles.row, { borderBottomColor: colors.borderLight }]}
    >
      <AppText
        variant="meta"
        tone="secondary"
        capped
        numberOfLines={1}
        style={styles.when}
      >
        {when}
      </AppText>
      <View style={styles.what}>
        <AppText
          variant="rowTitle"
          capped
          numberOfLines={titleLines}
          style={styles.title}
        >
          {title}
        </AppText>
        {favorite && (
          <MaterialCommunityIcons
            name="star"
            size={iconSize.sm}
            color={colors.primary}
          />
        )}
      </View>
      {channel ? (
        <BroadcasterPill name={channel} size="md" />
      ) : showTbd ? (
        <AppText variant="captionMedium" tone="tertiary" capped>
          a definir
        </AppText>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingVertical: spacing.sm,
  },
  when: {
    // Fits "dom 22 · 15:00" on one line with the system font at 100%.
    width: 112,
  },
  what: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  title: {
    flexShrink: 1,
  },
});
