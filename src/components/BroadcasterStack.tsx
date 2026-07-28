import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BroadcasterCircle } from './BroadcasterCircle';
import { useTheme } from '../contexts/ThemeContext';

interface BroadcasterStackProps {
  names: string[];
  size?: number;
  max?: number;
}

export const BroadcasterStack = React.memo(function BroadcasterStack({
  names,
  size = 22,
  max = 3,
}: BroadcasterStackProps) {
  const { colors } = useTheme();
  const visible = names.slice(0, max);
  // Render in reverse so the first broadcaster sits on top of the stack
  // and remains visually rightmost (default row direction).
  const ordered = [...visible].reverse();
  const ringSize = size + 4;
  const overlap = Math.round(size / 3) + 2;

  return (
    <View style={styles.stack} testID="broadcaster-stack">
      {ordered.map((name, i) => (
        <View
          key={name}
          style={[
            styles.ring,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderColor: colors.surface,
              marginLeft: i === 0 ? 0 : -overlap,
            },
          ]}
        >
          <BroadcasterCircle name={name} size={size} />
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ring: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
