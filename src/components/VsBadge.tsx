import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface VsBadgeProps {
  size?: number;
}

export function VsBadge({ size = 28 }: VsBadgeProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.vsBadgeBg,
        },
      ]}
      testID="vs-badge"
    >
      <Text
        style={[
          styles.text,
          { fontSize: size * 0.35, color: colors.textOnPrimary },
        ]}
      >
        VS
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '800',
  },
});
