import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Team } from '../types/match';
import { TeamCircle } from './TeamCircle';
import { useTheme } from '../contexts/ThemeContext';
import {
  spacing,
  radius,
  typography,
  iconSize,
  shadows,
} from '../constants/designTokens';

interface FavoriteTeamBannerProps {
  team: Team;
  opponentName: string;
  onPress: () => void;
}

export const FavoriteTeamBanner = React.memo(function FavoriteTeamBanner({
  team,
  opponentName,
  onPress,
}: FavoriteTeamBannerProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.banner,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      testID="favorite-team-banner"
    >
      <TeamCircle team={team} size={40} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Seu time joga hoje
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {team.name} {'\u00B7'} {opponentName}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={iconSize.md}
        color={colors.textTertiary}
      />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    fontSize: typography.size.sm,
    marginTop: 2,
  },
});
