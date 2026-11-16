import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { Team } from '../types/snapshot';
import { getTeamName } from '../utils/teamName';
import { TeamCircle } from './TeamCircle';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

interface FavoritePillProps {
  /** The favorite to show; without one the pill invites to pick it. */
  team?: Team;
  onPress: () => void;
}

/** The favorite team in the Home header, a tap away from changing it. */
export function FavoritePill({ team, onPress }: FavoritePillProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={
        team
          ? `Time favorito: ${getTeamName(team.name)}`
          : 'Escolha seu time favorito'
      }
      testID="favorite-pill"
      style={[
        styles.pill,
        {
          backgroundColor: colors.chipInactiveBg,
          borderColor: colors.chipBorder,
        },
      ]}
      onPress={onPress}
    >
      {team ? (
        <TeamCircle team={team} size={22} />
      ) : (
        <MaterialCommunityIcons
          name="star-outline"
          size={iconSize.md}
          color={colors.primary}
        />
      )}
      <Text
        numberOfLines={1}
        style={[styles.text, { color: colors.textPrimary }]}
      >
        {team ? getTeamName(team.name) : 'Escolha seu time'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 36,
    maxWidth: 160,
    paddingLeft: spacing.sm + 2,
    paddingRight: spacing.md,
  },
  text: {
    flexShrink: 1,
    fontSize: typography.size.sm + 1,
    fontWeight: typography.weight.semibold,
  },
});
