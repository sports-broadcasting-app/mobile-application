import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { GradientHeader } from '../../src/components/GradientHeader';

export default function ConfiguracoesTabScreen() {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader />

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Aparencia
        </Text>

        <TouchableOpacity
          style={[
            styles.settingRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={toggleTheme}
          testID="theme-toggle"
        >
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons
              name={isDark ? 'weather-night' : 'weather-sunny'}
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
              Tema
            </Text>
          </View>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            {isDark ? 'Escuro' : 'Claro'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          OndeVer v1.0.0
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 40,
  },
});
