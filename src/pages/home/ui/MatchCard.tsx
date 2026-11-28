import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/Icon';
import screenPlay from '../../../../assets/tabs/screen-play.png';
import { getCompetition } from '@/shared/config/competitions';
import { useTheme } from '@/shared/theme/ThemeContext';
import { Match, Team } from '@/shared/api/snapshot';
import { openLink } from '@/shared/lib/links';
import { describeMatch } from '@/entities/match/lib/accessibility';
import { getChannelUrl } from '@/entities/broadcast/lib/broadcast';
import { formatTime } from '@/shared/lib/date';
import { formatRound } from '@/entities/match/lib/roundLabel';
import { getTeamName } from '@/shared/lib/teamName';
import { TeamCircle } from '@/entities/team/ui/TeamCircle';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '@/shared/theme/designTokens';

/** More than this becomes noise under the score. */
const MAX_CHANNEL_BUTTONS = 2;
const PULSE_MS = 900;

interface MatchCardProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  favorite?: boolean;
  /** Off where a header already names the competition. */
  showCompetition?: boolean;
  onPress?: () => void;
}

function TeamColumn({ team }: { team: Team }) {
  return (
    <View style={styles.team}>
      <TeamCircle team={team} size={48} />
      <AppText
        variant="bodyStrong"
        numberOfLines={2}
        capped
        style={styles.teamName}
      >
        {getTeamName(team.name)}
      </AppText>
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
    <View style={[styles.liveBadge, { backgroundColor: colors.live }]}>
      <Animated.View
        style={[
          styles.liveDot,
          { backgroundColor: colors.onLive, opacity: pulse },
        ]}
      />
      <AppText tone="onLive" capped style={styles.liveText}>
        AO VIVO
      </AppText>
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
  showCompetition = true,
  onPress,
}: MatchCardProps) {
  const { colors } = useTheme();
  const isLive = match.status === 'live';
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const channels = match.channels.slice(0, MAX_CHANNEL_BUTTONS);

  const metaParts = [
    formatTime(match.startsAt),
    showCompetition ? getCompetition(match.competition).label : '',
    formatRound(match.roundLabel),
  ].filter(Boolean);
  const meta = metaParts.join(' · ');
  const summary = describeMatch({
    match,
    homeName: homeTeam.name,
    awayName: awayTeam.name,
    favorite,
    details: metaParts,
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={onPress}
      // The summary below is the screen-reader element; the watch buttons stay
      // separate, so the card itself must not group everything.
      accessible={false}
      testID={`match-card-${match.id}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: favorite ? colors.primary : colors.borderLight,
        },
      ]}
    >
      <View
        accessible
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={summary}
        accessibilityHint={onPress ? 'Abre os detalhes do jogo' : undefined}
        accessibilityActions={onPress ? [{ name: 'activate' }] : undefined}
        onAccessibilityAction={onPress}
        style={styles.summary}
        testID={`match-summary-${match.id}`}
      >
        <View style={styles.header}>
          <AppText
            variant="meta"
            tone="secondary"
            numberOfLines={2}
            capped
            style={styles.meta}
          >
            {meta}
          </AppText>
          {favorite && (
            <Icon
              name="star"
              size={iconSize.sm}
              color={colors.primary}
              testID="favorite-star"
            />
          )}
          {isLive && <LiveBadge />}
          {match.status === 'postponed' && (
            <AppText variant="meta" tone="error" capped style={styles.meta}>
              Adiado
            </AppText>
          )}
        </View>

        <View style={styles.scoreRow}>
          <TeamColumn team={homeTeam} />
          <View style={styles.score}>
            {hasScore && (
              <AppText capped style={styles.scoreText}>
                {match.homeScore}
              </AppText>
            )}
            <AppText
              capped
              style={[styles.versus, { color: colors.versusText }]}
            >
              ×
            </AppText>
            {hasScore && (
              <AppText capped style={styles.scoreText}>
                {match.awayScore}
              </AppText>
            )}
          </View>
          <TeamColumn team={awayTeam} />
        </View>
      </View>

      {/* Without a channel: "a definir" only before kickoff; a finished game
          says so, a live one shows nothing (the AO VIVO badge says it). */}
      {channels.length === 0 && !isLive && (
        <AppText
          variant="meta"
          tone="tertiary"
          // Already in the summary above.
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={styles.noChannel}
        >
          {match.status === 'finished'
            ? 'Jogo encerrado'
            : 'Transmissão a definir'}
        </AppText>
      )}
      {channels.map((channel) => {
        const url = getChannelUrl(channel);
        if (!url) {
          return (
            <AppText
              variant="meta"
              tone="secondary"
              key={channel}
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={styles.noChannel}
            >
              {`Passa na ${channel}`}
            </AppText>
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
                ? { backgroundColor: colors.primary }
                : [
                    styles.watchSecondary,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: colors.border,
                    },
                  ],
            ]}
            onPress={() => openLink(url)}
          >
            <Image
              source={screenPlay}
              style={[
                styles.watchIcon,
                { tintColor: primary ? colors.onPrimary : colors.primary },
              ]}
            />
            <AppText
              capped
              style={[
                styles.watchText,
                { color: primary ? colors.onPrimary : colors.textPrimary },
              ]}
            >
              {primary ? `Assistir no ${channel}` : `Abrir no ${channel}`}
            </AppText>
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
  summary: {
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  meta: {
    flex: 1,
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
    // Shares the row with the score instead of a fixed 110: long names
    // ("Athletico-PR") get the room the score does not use.
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  teamName: {
    textAlign: 'center',
  },
  score: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
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
    textAlign: 'center',
  },
  watch: {
    alignItems: 'center',
    borderRadius: radius.md + 2,
    flexDirection: 'row',
    gap: spacing.sm + 2,
    justifyContent: 'center',
    // Grows with larger text instead of clipping the label.
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  watchSecondary: {
    borderWidth: 1,
  },
  watchIcon: {
    height: iconSize.md,
    width: iconSize.md,
  },
  watchText: {
    flexShrink: 1,
    fontSize: typography.size.body + 1,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
  },
});
