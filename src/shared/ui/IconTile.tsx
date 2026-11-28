import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { radius } from '@/shared/theme/designTokens';

interface IconTileProps {
  children: ReactNode;
  /** Side in points (36 in sheets, 34 in settings, 40 on onboarding tiles). */
  size?: number;
  /** A filled tile (a picked sport) uses `primary`; the default is the well. */
  active?: boolean;
}

/** An icon on a small rounded well, in front of a row's name. */
export function IconTile({
  children,
  size = 36,
  active = false,
}: IconTileProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size >= 40 ? radius.md : radius.sm,
          backgroundColor: active ? colors.primary : colors.surfaceAlt,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
