import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from './AppText';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import {
  addDays,
  formatLongDay,
  formatStripDay,
  getDayBounds,
} from '../utils/date';
import {
  radius,
  spacing,
  touchTarget,
  typography,
} from '../constants/designTokens';

/** Size of the dot under a day with something on. */
const DOT = 6;

/** Days before today the strip starts at (yesterday's results). */
export const STRIP_FIRST_OFFSET = -1;
/** Days after today it reaches: two weekends ahead. */
export const STRIP_LAST_OFFSET = 13;

interface DayStripProps {
  /** Today, as the device sees it. */
  today: Date;
  /** The chosen day, in days from today. */
  selected: number;
  onSelect: (offset: number) => void;
  /** Local day starts with a game or session of what the Home shows. */
  eventDays: Set<number>;
}

/**
 * The week as a strip: yesterday, today and the next two weeks, with a dot
 * under the days that have something to watch. Race weekends and NFL
 * Sundays are a few days away, which three chips (yesterday, today,
 * tomorrow) never reached.
 */
export function DayStrip({
  today,
  selected,
  onSelect,
  eventDays,
}: DayStripProps) {
  const { colors } = useTheme();
  const offsets = Array.from(
    { length: STRIP_LAST_OFFSET - STRIP_FIRST_OFFSET + 1 },
    (_, index) => STRIP_FIRST_OFFSET + index,
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
      testID="day-strip"
    >
      {offsets.map((offset) => {
        const date = addDays(today, offset);
        const active = offset === selected;
        const hasEvents = eventDays.has(getDayBounds(date).start);
        return (
          <TouchableOpacity
            key={offset}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${formatLongDay(date)}${hasEvents ? ', com jogos' : ''}`}
            testID={`day-${offset}`}
            style={[styles.day, active && { backgroundColor: colors.primary }]}
            onPress={() => onSelect(offset)}
          >
            <AppText
              capped
              style={[
                styles.label,
                { color: active ? colors.onPrimary : colors.textSecondary },
              ]}
            >
              {formatStripDay(date, offset)}
            </AppText>
            <AppText
              capped
              style={[
                styles.number,
                { color: active ? colors.onPrimary : colors.textPrimary },
              ]}
            >
              {date.getDate()}
            </AppText>
            {/* SVG: Android drew a View this small as a square. */}
            <Svg
              width={DOT}
              height={DOT}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {hasEvents && (
                <Circle
                  cx={DOT / 2}
                  cy={DOT / 2}
                  r={DOT / 2}
                  fill={active ? colors.onPrimary : colors.primary}
                />
              )}
            </Svg>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  day: {
    alignItems: 'center',
    borderRadius: radius.lg,
    gap: 2,
    minHeight: touchTarget + 12,
    minWidth: 48,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs + 2,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  number: {
    fontSize: typography.size.md + 1,
    fontWeight: typography.weight.bold,
  },
});
