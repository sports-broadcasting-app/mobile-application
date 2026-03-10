import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface BroadcasterPillProps {
  name: string;
}

export function BroadcasterPill({ name }: BroadcasterPillProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.pill, { backgroundColor: colors.broadcastBadgeBg }]}
      testID={`broadcaster-pill-${name}`}
    >
      <Text style={[styles.text, { color: colors.primary }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
  },
});
