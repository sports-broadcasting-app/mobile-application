import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';

interface GradientHeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
  rightElement?: ReactNode;
  children?: ReactNode;
}

export function GradientHeader({
  showBackButton = false,
  onBack,
  rightElement,
  children,
}: GradientHeaderProps) {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.gradient}
    >
      <View style={styles.topRow}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            testID="gradient-header-back"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.textOnPrimary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <View style={styles.logoRow}>
          <MaterialCommunityIcons
            name="television-classic"
            size={28}
            color={colors.textOnPrimary}
          />
          <Text style={[styles.title, { color: colors.textOnPrimary }]}>
            OndeVer
          </Text>
        </View>

        {rightElement ?? <View style={styles.backPlaceholder} />}
      </View>

      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 36,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
});
