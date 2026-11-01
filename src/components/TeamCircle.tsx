import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Team } from '../types/superliga';
import { getTeamColor } from '../utils/teamColor';

interface TeamCircleProps {
  team: Team;
  size?: number;
}

export const TeamCircle = React.memo(function TeamCircle({
  team,
  size = 72,
}: TeamCircleProps) {
  const color = getTeamColor(team.id);
  const [imageError, setImageError] = useState(false);
  const logoUrl = team.badgeUrl;
  const showImage = !!logoUrl && !imageError;

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: showImage ? 'transparent' : color,
        },
      ]}
      testID={`team-circle-${team.id}`}
    >
      {showImage ? (
        <Image
          source={{ uri: logoUrl }}
          cachePolicy="disk"
          style={{ width: size, height: size }}
          contentFit="contain"
          onError={() => setImageError(true)}
          testID={`team-logo-${team.id}`}
        />
      ) : size >= 32 ? (
        <Text style={[styles.acronym, { fontSize: size * 0.3 }]}>
          {team.code}
        </Text>
      ) : null}
    </View>
  );
});

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
