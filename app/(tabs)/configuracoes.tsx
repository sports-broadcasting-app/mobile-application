import { useState, useMemo, useCallback } from 'react';
import {
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../src/contexts/ThemeContext';
import {
  useFavoriteTeams,
  FavoriteTeamEntry,
} from '../../src/contexts/FavoriteTeamsContext';
import { TeamPicker } from '../../src/components/TeamPicker';
import { TeamCircle } from '../../src/components/TeamCircle';
import { Team, Sport } from '../../src/types/match';
import {
  spacing,
  radius,
  typography,
  iconSize,
} from '../../src/constants/designTokens';

export default function ConfiguracoesTabScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const {
    favoriteTeams,
    addFavoriteTeam,
    removeFavoriteTeam,
    clearAllFavoriteTeams,
    isFavorite,
  } = useFavoriteTeams();
  const [showPicker, setShowPicker] = useState(false);

  const selectedSlugs = useMemo(
    () => new Set(favoriteTeams.map((f) => f.team.slug)),
    [favoriteTeams],
  );

  const handleToggleTeam = useCallback(
    (team: Team, sport: Sport) => {
      if (isFavorite(team.slug)) {
        removeFavoriteTeam(team.slug);
      } else {
        addFavoriteTeam(team, sport);
      }
    },
    [isFavorite, addFavoriteTeam, removeFavoriteTeam],
  );

  const handleRateApp = () => {
    const storeUrl = Platform.select({
      android: 'https://play.google.com/store/apps/details?id=com.ondever.app',
      ios: 'https://apps.apple.com/app/ondever/id0000000000',
    });
    if (storeUrl) Linking.openURL(storeUrl);
  };

  const handleShareApp = async () => {
    await Share.share({
      message:
        'Confira o OndeVer - descubra onde assistir jogos ao vivo! https://ondever.app',
    });
  };

  const handleContactUs = () => {
    Linking.openURL('mailto:contato@ondever.app');
  };

  const renderSettingRow = ({
    icon,
    label,
    value,
    onPress,
    testID,
  }: {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    label: string;
    value?: string;
    onPress?: () => void;
    testID?: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingRow,
        { backgroundColor: colors.surfaceCard, borderColor: colors.border },
      ]}
      onPress={onPress}
      testID={testID}
    >
      <View style={styles.settingLeft}>
        <MaterialCommunityIcons
          name={icon}
          size={iconSize.lg}
          color={colors.primary}
        />
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {value && (
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            {value}
          </Text>
        )}
        <MaterialCommunityIcons
          name="chevron-right"
          size={iconSize.md}
          color={colors.textTertiary}
        />
      </View>
    </TouchableOpacity>
  );

  const renderFavoriteRow = (entry: FavoriteTeamEntry) => (
    <View
      key={entry.team.slug}
      style={[
        styles.favoriteRow,
        { backgroundColor: colors.surfaceCard, borderColor: colors.border },
      ]}
    >
      <View style={styles.favoriteRowLeft}>
        <TeamCircle team={entry.team} size={iconSize.lg} />
        <Text
          style={[styles.favoriteTeamName, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {entry.team.name}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => removeFavoriteTeam(entry.team.slug)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        testID={`remove-${entry.team.slug}`}
      >
        <MaterialCommunityIcons
          name="close-circle"
          size={iconSize.md}
          color={colors.error}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Simple header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Preferencias
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Aparencia */}
        <Text
          style={[styles.sectionTitle, { color: colors.sectionHeaderText }]}
        >
          Aparencia
        </Text>
        {renderSettingRow({
          icon: isDark ? 'weather-night' : 'weather-sunny',
          label: 'Tema',
          value: isDark ? 'Escuro' : 'Claro',
          onPress: toggleTheme,
          testID: 'theme-toggle',
        })}

        {/* Notificacoes */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.sectionHeaderText, marginTop: spacing.xxl },
          ]}
        >
          Notificacoes
        </Text>
        {renderSettingRow({
          icon: 'soccer',
          label: 'Esportes favoritos',
        })}
        {renderSettingRow({
          icon: 'heart',
          label: 'Times favoritos',
          onPress: () => setShowPicker((prev) => !prev),
        })}

        {/* Inline favorite teams */}
        {favoriteTeams.length > 0 && (
          <View style={styles.inlineTeams}>
            {favoriteTeams.map(renderFavoriteRow)}
          </View>
        )}

        {/* Team picker */}
        {showPicker && (
          <View style={styles.pickerContainer}>
            <TeamPicker
              onToggleTeam={handleToggleTeam}
              selectedSlugs={selectedSlugs}
            />
          </View>
        )}

        {/* Clear all */}
        {favoriteTeams.length > 0 && (
          <TouchableOpacity
            style={[styles.removeButton, { borderColor: colors.error }]}
            onPress={() => {
              clearAllFavoriteTeams();
              setShowPicker(false);
            }}
            testID="remove-all-favorites"
          >
            <MaterialCommunityIcons
              name="heart-remove"
              size={iconSize.sm}
              color={colors.error}
            />
            <Text style={[styles.removeText, { color: colors.error }]}>
              Remover todos
            </Text>
          </TouchableOpacity>
        )}

        {/* Conta e suporte */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.sectionHeaderText, marginTop: spacing.xxl },
          ]}
        >
          Conta e suporte
        </Text>
        {renderSettingRow({
          icon: 'star-outline',
          label: 'Avaliar app',
          onPress: handleRateApp,
        })}
        {renderSettingRow({
          icon: 'share-variant',
          label: 'Compartilhar app',
          onPress: handleShareApp,
        })}
        {renderSettingRow({
          icon: 'phone-outline',
          label: 'Fale conosco',
          onPress: handleContactUs,
        })}

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
  header: {
    paddingTop: 56,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
  },
  content: {
    padding: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingValue: {
    fontSize: typography.size.body,
  },
  inlineTeams: {
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingLeft: spacing.xxxl,
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  favoriteRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  favoriteTeamName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    flex: 1,
  },
  pickerContainer: {
    marginTop: spacing.sm,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  removeText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  version: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
});
