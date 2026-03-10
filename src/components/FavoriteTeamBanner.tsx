import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Team } from '../types/match';
import { TeamCircle } from './TeamCircle';
import { useTheme } from '../contexts/ThemeContext';

interface FavoriteTeamBannerProps {
  team: Team;
  matchHour: string;
  opponentName: string;
  onPress: () => void;
}

export function FavoriteTeamBanner({
  team,
  matchHour,
  opponentName,
  onPress,
}: FavoriteTeamBannerProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: colors.surfaceAlt }]}
      onPress={onPress}
      activeOpacity={0.7}
      testID="favorite-team-banner"
    >
      <View style={[styles.accent, { backgroundColor: colors.primary }]} />
      <TeamCircle team={team} size={36} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Seu time joga hoje!
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          vs {opponentName} - {matchHour}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={colors.textTertiary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  textContainer: {
    flex: 1,
    marginLeft: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
