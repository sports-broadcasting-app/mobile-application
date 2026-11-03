import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemeMode, useTheme } from '../contexts/ThemeContext';
import { radius, spacing, typography } from '../constants/designTokens';
import darkPreview from '../../assets/appearance/dark.png';
import lightPreview from '../../assets/appearance/light.png';
import systemPreview from '../../assets/appearance/system.png';

const OPTIONS: {
  value: ThemeMode;
  label: string;
  preview: ImageSourcePropType;
}[] = [
  {
    value: 'system',
    label: 'Do aparelho',
    preview: systemPreview,
  },
  {
    value: 'light',
    label: 'Claro',
    preview: lightPreview,
  },
  {
    value: 'dark',
    label: 'Escuro',
    preview: darkPreview,
  },
];

export function AppearancePicker() {
  const { colors, mode, setThemeMode } = useTheme();

  return (
    <View style={styles.row}>
      {OPTIONS.map(({ value, label, preview }) => {
        const selected = value === mode;
        return (
          <TouchableOpacity
            key={value}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            testID={`appearance-${value}`}
            style={styles.option}
            onPress={() => setThemeMode(value)}
          >
            <View
              style={[
                styles.frame,
                { borderColor: selected ? colors.primary : colors.background },
              ]}
            >
              <Image source={preview} style={styles.preview} />
            </View>
            <Text
              style={[
                styles.label,
                { color: selected ? colors.primary : colors.textSecondary },
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

const PREVIEW_SIZE = 72;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  option: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  frame: {
    borderRadius: radius.lg + 4,
    borderWidth: 3,
    padding: 3,
  },
  preview: {
    borderRadius: radius.lg,
    height: PREVIEW_SIZE,
    width: PREVIEW_SIZE,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
