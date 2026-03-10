import { StyleSheet, Text, View } from 'react-native';
import { getBroadcasterBrand } from '../constants/broadcasterBrands';

interface BroadcasterCircleProps {
  name: string;
  size?: number;
}

export function BroadcasterCircle({ name, size = 40 }: BroadcasterCircleProps) {
  const brand = getBroadcasterBrand(name);

  if (!brand) return null;

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: brand.backgroundColor,
        },
      ]}
      testID={`broadcaster-circle-${name}`}
    >
      <Text
        style={[
          styles.initials,
          { fontSize: size * 0.35, color: brand.textColor },
        ]}
      >
        {brand.initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '800',
  },
});
