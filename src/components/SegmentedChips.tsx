import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, typography } from '../constants/designTokens';

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedChipsProps<T extends string> {
  options: ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  /** Scrolls sideways instead of wrapping, for rows that keep growing. */
  scrollable?: boolean;
}

const CHIP_HEIGHT = 36;
const ARROW_WIDTH = 10;
// Brings the 36pt chip up to the 44pt touch target.
const HIT_SLOP = { top: 4, bottom: 4, left: 0, right: 0 };

/** Filter chips; the active one ends in the play arrow of the app icon. */
export function SegmentedChips<T extends string>({
  options,
  selected,
  onSelect,
  scrollable = false,
}: SegmentedChipsProps<T>) {
  const { colors } = useTheme();

  const chips = options.map(({ value, label }) => {
    const active = value === selected;
    return (
      <TouchableOpacity
        key={value}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        hitSlop={HIT_SLOP}
        style={styles.touch}
        onPress={() => onSelect(value)}
      >
        <View
          style={[
            styles.chip,
            active ? styles.chipActive : { borderColor: colors.chipBorder },
            {
              backgroundColor: active
                ? colors.chipActiveBg
                : colors.chipInactiveBg,
            },
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                color: active ? colors.chipActiveText : colors.chipInactiveText,
              },
            ]}
          >
            {label}
          </Text>
        </View>
        {active && (
          <View
            style={[styles.arrow, { borderLeftColor: colors.chipActiveBg }]}
          />
        )}
      </TouchableOpacity>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {chips}
      </ScrollView>
    );
  }
  return <View style={styles.row}>{chips}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  scrollRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  touch: {
    flexDirection: 'row',
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    height: CHIP_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  chipActive: {
    borderColor: 'transparent',
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
    paddingRight: spacing.md,
  },
  arrow: {
    borderBottomColor: 'transparent',
    borderBottomWidth: CHIP_HEIGHT / 2,
    borderLeftWidth: ARROW_WIDTH,
    borderTopColor: 'transparent',
    borderTopWidth: CHIP_HEIGHT / 2,
    height: CHIP_HEIGHT,
    width: ARROW_WIDTH,
  },
  label: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
});
