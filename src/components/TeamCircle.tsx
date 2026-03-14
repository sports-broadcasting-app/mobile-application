import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Team } from '../types/match';
import { getTeamColor } from '../utils/teamColor';
import { useTeamLogos } from '../contexts/TeamLogoContext';

interface TeamCircleProps {
  team: Team;
  size?: number;
}

export const TeamCircle = React.memo(function TeamCircle({
  team,
  size = 72,
}: TeamCircleProps) {
  const logos = useTeamLogos();
  const color = getTeamColor(team.slug);
  const [imageError, setImageError] = useState(false);
  const logoUrl = team.logoUrl || logos.get(team.slug);
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
      testID={`team-circle-${team.slug}`}
    >
      {showImage ? (
        <Image
          source={{ uri: logoUrl }}
          style={{ width: size, height: size }}
          contentFit="contain"
          onError={() => setImageError(true)}
          testID={`team-logo-${team.slug}`}
        />
      ) : size >= 32 ? (
        <Text style={[styles.acronym, { fontSize: size * 0.3 }]}>
          {team.acronym}
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
