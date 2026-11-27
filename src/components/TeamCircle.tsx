import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Image } from 'expo-image';
import { Team } from '../types/snapshot';
import { getTeamColor, TEAM_TEXT_COLOR } from '../utils/teamColor';

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
        { width: size, height: size, borderRadius: size / 2 },
        // Without the logo, the circle shows the code over the team color.
        !showImage && { backgroundColor: color },
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
        <AppText
          style={[
            styles.acronym,
            { color: TEAM_TEXT_COLOR, fontSize: size * 0.3 },
          ]}
        >
          {team.code}
        </AppText>
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
    fontWeight: '800',
  },
});
