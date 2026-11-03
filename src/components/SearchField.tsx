import { StyleSheet, TextInput, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  testID?: string;
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  testID,
}: SearchFieldProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.search,
        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
      ]}
    >
      <MaterialCommunityIcons
        name="magnify"
        size={iconSize.md}
        color={colors.textTertiary}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
        testID={testID}
        style={[styles.input, { color: colors.textPrimary }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: typography.size.body,
    paddingVertical: spacing.md,
  },
});
