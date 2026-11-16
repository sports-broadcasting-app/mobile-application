import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import screenPlay from '../../assets/tabs/screen-play.png';
import { getCompetition } from '../constants/competitions';
import { useTheme } from '../contexts/ThemeContext';
import { Match, Team } from '../types/snapshot';
import { getChannelUrl } from '../utils/broadcast';
import { formatTime } from '../utils/date';
import { formatRound } from '../utils/roundLabel';
import { getTeamName } from '../utils/teamName';
import { TeamCircle } from './TeamCircle';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

/** More than this becomes noise under the score. */
const MAX_CHANNEL_BUTTONS = 2;
const PULSE_MS = 900;

interface MatchCardProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  favorite?: boolean;
  onPress?: () => void;
}

function TeamColumn({ team }: { team: Team }) {
  const { colors } = useTheme();
  return (
    <View style={styles.team}>
      <TeamCircle team={team} size={48} />
      <Text
        numberOfLines={1}
        style={[styles.teamName, { color: colors.textPrimary }]}
      >
        {getTeamName(team.name)}
      </Text>
    </View>
  );
}

function LiveBadge() {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.2,
          duration: PULSE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: PULSE_MS,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={[styles.liveBadge, { backgroundColor: colors.error }]}>
      <Animated.View
        style={[
          styles.liveDot,
          { backgroundColor: colors.textOnPrimary, opacity: pulse },
        ]}
      />
      <Text style={[styles.liveText, { color: colors.textOnPrimary }]}>
        AO VIVO
      </Text>
    </View>
  );
}

/**
 * One match of the day: time and competition on top, the score between the
 * two clubs, and the broadcaster as the button that opens its app.
 */
export const MatchCard = React.memo(function MatchCard({
  match,
  homeTeam,
  awayTeam,
  favorite = false,
  onPress,
}: MatchCardProps) {
  const { colors } = useTheme();
  const isLive = match.status === 'live';
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const channels = match.channels.slice(0, MAX_CHANNEL_BUTTONS);

  const meta = [
    formatTime(match.startsAt),
    getCompetition(match.competition).label,
    formatRound(match.roundLabel),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={onPress}
      testID={`match-card-${match.id}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: favorite ? colors.primary : colors.borderLight,
        },
      ]}
    >
      <View style={styles.header}>
        <Text
          numberOfLines={1}
          style={[styles.meta, { color: colors.textSecondary }]}
        >
          {meta}
        </Text>
        {favorite && (
          <MaterialCommunityIcons
            name="star"
            size={iconSize.sm}
            color={colors.primary}
            testID="favorite-star"
          />
        )}
        {isLive && <LiveBadge />}
        {match.status === 'postponed' && (
          <Text style={[styles.meta, { color: colors.error }]}>Adiado</Text>
        )}
      </View>

      <View style={styles.scoreRow}>
        <TeamColumn team={homeTeam} />
        <View style={styles.score}>
          {hasScore && (
            <Text style={[styles.scoreText, { color: colors.textPrimary }]}>
              {match.homeScore}
            </Text>
          )}
          <Text style={[styles.versus, { color: colors.vsBadgeBg }]}>×</Text>
          {hasScore && (
            <Text style={[styles.scoreText, { color: colors.textPrimary }]}>
              {match.awayScore}
            </Text>
          )}
        </View>
        <TeamColumn team={awayTeam} />
      </View>

      {channels.length === 0 && (
        <Text style={[styles.noChannel, { color: colors.textTertiary }]}>
          Transmissão a definir
        </Text>
      )}
      {channels.map((channel) => {
        const url = getChannelUrl(channel);
        if (!url) {
          return (
            <Text
              key={channel}
              style={[styles.noChannel, { color: colors.textSecondary }]}
            >
              {`Passa na ${channel}`}
            </Text>
          );
        }
        const primary = isLive;
        return (
          <TouchableOpacity
            key={channel}
            accessibilityRole="button"
            testID={`watch-button-${channel}`}
            style={[
              styles.watch,
              primary
                ? { backgroundColor: colors.watchBtnBg }
                : [
                    styles.watchSecondary,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: colors.border,
                    },
                  ],
            ]}
            onPress={() => {
              Linking.openURL(url).catch(() => {});
            }}
          >
            <Image
              source={screenPlay}
              style={[
                styles.watchIcon,
                { tintColor: primary ? colors.watchBtnText : colors.primary },
              ]}
            />
            <Text
              style={[
                styles.watchText,
                { color: primary ? colors.watchBtnText : colors.textPrimary },
              ]}
            >
              {primary ? `Assistir no ${channel}` : `Abrir no ${channel}`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg + 2,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  meta: {
    flex: 1,
    fontSize: typography.size.sm + 1,
    fontWeight: typography.weight.medium,
  },
  liveBadge: {
    alignItems: 'center',
    borderRadius: radius.sm + 2,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  liveDot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  liveText: {
    fontSize: typography.size.xs + 1,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.4,
  },
  scoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  team: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 110,
  },
  teamName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  score: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scoreText: {
    fontSize: typography.size.score,
    fontWeight: typography.weight.heavy,
    letterSpacing: -1,
    lineHeight: typography.size.score + 4,
  },
  versus: {
    fontSize: typography.size.xl + 2,
    fontWeight: typography.weight.semibold,
  },
  noChannel: {
    fontSize: typography.size.sm + 1,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
  },
  watch: {
    alignItems: 'center',
    borderRadius: radius.md + 2,
    flexDirection: 'row',
    gap: spacing.sm + 2,
    height: 48,
    justifyContent: 'center',
  },
  watchSecondary: {
    borderWidth: 1,
  },
  watchIcon: {
    height: iconSize.md,
    width: iconSize.md,
  },
  watchText: {
    fontSize: typography.size.body + 1,
    fontWeight: typography.weight.bold,
  },
});
