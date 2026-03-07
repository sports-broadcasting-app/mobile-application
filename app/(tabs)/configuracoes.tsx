import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useFavoriteTeam } from '../../src/contexts/FavoriteTeamContext';
import { GradientHeader } from '../../src/components/GradientHeader';
import { TeamPicker } from '../../src/components/TeamPicker';
import { TeamCircle } from '../../src/components/TeamCircle';

export default function ConfiguracoesTabScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { favoriteTeam, setFavoriteTeam, clearFavoriteTeam } =
    useFavoriteTeam();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader />

      <ScrollView style={styles.content}>
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

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textPrimary, marginTop: 24 },
          ]}
        >
          Time Favorito
        </Text>

        <TouchableOpacity
          style={[
            styles.settingRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => setShowPicker((prev) => !prev)}
          testID="favorite-team-toggle"
        >
          <View style={styles.settingLeft}>
            {favoriteTeam ? (
              <TeamCircle team={favoriteTeam.team} size={28} />
            ) : (
              <MaterialCommunityIcons
                name="heart-outline"
                size={24}
                color={colors.primary}
              />
            )}
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
              {favoriteTeam ? favoriteTeam.team.name : 'Selecionar time'}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={showPicker ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.textTertiary}
          />
        </TouchableOpacity>

        {showPicker && (
          <View style={styles.pickerContainer}>
            <TeamPicker
              onSelect={(team, sport) => {
                setFavoriteTeam(team, sport);
                setShowPicker(false);
              }}
              selectedSlug={favoriteTeam?.team.slug ?? null}
            />
          </View>
        )}

        {favoriteTeam && (
          <TouchableOpacity
            style={[styles.removeButton, { borderColor: colors.error }]}
            onPress={() => {
              clearFavoriteTeam();
              setShowPicker(false);
            }}
            testID="remove-favorite"
          >
            <MaterialCommunityIcons
              name="heart-remove"
              size={18}
              color={colors.error}
            />
            <Text style={[styles.removeText, { color: colors.error }]}>
              Remover favorito
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          OndeVer v1.0.0
        </Text>
      </ScrollView>
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
  pickerContainer: {
    marginTop: 8,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  removeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
});
