import { StyleSheet, Text, View } from 'react-native';
import { Team } from '../types/match';
import { getTeamColor } from '../utils/teamColor';

interface TeamCircleProps {
  team: Team;
  size?: number;
}

export function TeamCircle({ team, size = 72 }: TeamCircleProps) {
  const color = getTeamColor(team.slug);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
      testID={`team-circle-${team.slug}`}
    >
      <Text style={[styles.acronym, { fontSize: size * 0.3 }]}>
        {team.acronym}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  acronym: {
    color: '#fff',
    fontWeight: '800',
  },
});
