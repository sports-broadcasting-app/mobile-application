import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
}

export function SegmentedChips<T extends string>({
  options,
  selected,
  onSelect,
}: SegmentedChipsProps<T>) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {options.map(({ value, label }) => {
        const active = value === selected;
        return (
          <TouchableOpacity
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.chip,
              {
                backgroundColor: active
                  ? colors.chipActiveBg
                  : colors.chipInactiveBg,
                borderColor: active ? colors.chipActiveBg : colors.chipBorder,
              },
            ]}
            onPress={() => onSelect(value)}
          >
            <Text
              style={[
                styles.label,
                {
                  color: active
                    ? colors.chipActiveText
                    : colors.chipInactiveText,
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
