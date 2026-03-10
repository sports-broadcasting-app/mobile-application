import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface CtaButtonProps {
  label: string;
  onPress: () => void;
}

export function CtaButton({ label, onPress }: CtaButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.ctaBackground }]}
      activeOpacity={0.8}
      onPress={onPress}
      testID="cta-button"
    >
      <Text style={[styles.label, { color: colors.ctaText }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
