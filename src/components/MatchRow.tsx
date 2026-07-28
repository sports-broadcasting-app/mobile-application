import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FormulaOneMatch, Match, TeamMatch } from '../types/match';
import { TeamCircle } from './TeamCircle';
import { BroadcasterStack } from './BroadcasterStack';
import { useTheme } from '../contexts/ThemeContext';
import { formatHour } from '../utils/dateFormat';

interface MatchRowProps {
  match: Match;
  onPress?: () => void;
  dim?: boolean;
}

export const MatchRow = React.memo(function MatchRow({
  match,
  onPress,
  dim,
}: MatchRowProps) {
  const { colors } = useTheme();
  const isLive = match.status === 'match-live';
  const broadcasters = match.broadcast.map((b) => b.name);

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      disabled={!onPress}
      testID={`match-card-${match.id}`}
      style={[styles.row, { borderTopColor: colors.border }, dim && styles.dim]}
    >
      <View style={styles.timeColumn}>
        {isLive ? (
          <View style={styles.liveWrap}>
            <View style={[styles.liveDot, { backgroundColor: colors.error }]} />
            <Text style={[styles.liveText, { color: colors.error }]}>
              AO VIVO
            </Text>
          </View>
        ) : (
          <Text style={[styles.time, { color: colors.textPrimary }]}>
            {formatHour(match.hour)}
          </Text>
        )}
      </View>

      <View style={styles.middleColumn}>
        {match.sport === 'formula1' ? (
          <F1Body match={match} />
        ) : (
          <TeamBody match={match} live={isLive} />
        )}
      </View>

      {broadcasters.length > 0 && (
        <View style={styles.broadcastColumn}>
          <BroadcasterStack names={broadcasters} size={22} />
        </View>
      )}
    </TouchableOpacity>
  );
});

function F1Body({ match }: { match: FormulaOneMatch }) {
  const { colors } = useTheme();
  return (
    <View>
      <Text
        numberOfLines={1}
        style={[styles.eventName, { color: colors.textPrimary }]}
      >
        {match.eventName}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.eventSession, { color: colors.textSecondary }]}
      >
        {match.sessionLabel}
      </Text>
    </View>
  );
}

function TeamBody({ match, live }: { match: TeamMatch; live: boolean }) {
  const hasScore = match.status !== 'match-not-started';
  const homeScore = hasScore
    ? match.score.type === 'football'
      ? match.score.goals.home
      : match.score.sets.home
    : null;
  const awayScore = hasScore
    ? match.score.type === 'football'
      ? match.score.goals.away
      : match.score.sets.away
    : null;

  return (
    <View>
      <TeamLine
        team={match.homeTeam}
        score={homeScore}
        live={live}
        hasScore={hasScore}
      />
      <View style={styles.teamGap} />
      <TeamLine
        team={match.awayTeam}
        score={awayScore}
        live={live}
        hasScore={hasScore}
      />
    </View>
  );
}

interface TeamLineProps {
  team: TeamMatch['homeTeam'];
  score: number | null;
  live: boolean;
  hasScore: boolean;
}

function TeamLine({ team, score, live, hasScore }: TeamLineProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.teamLine}>
      <TeamCircle team={team} size={22} />
      <Text
        numberOfLines={1}
        style={[
          styles.teamName,
          {
            color: colors.textPrimary,
            fontWeight: live ? '700' : '500',
          },
        ]}
      >
        {team.name}
      </Text>
      {hasScore && score !== null && (
        <Text
          style={[
            styles.score,
            {
              color: colors.textPrimary,
              fontWeight: live ? '800' : '600',
            },
          ]}
        >
          {score}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  dim: {
    opacity: 0.6,
  },
  timeColumn: {
    width: 52,
  },
  middleColumn: {
    flex: 1,
    minWidth: 0,
  },
  broadcastColumn: {
    flexShrink: 0,
  },
  liveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  time: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  teamLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamGap: {
    height: 4,
  },
  teamName: {
    flex: 1,
    fontSize: 14,
  },
  score: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  eventName: {
    fontSize: 14,
    fontWeight: '700',
  },
  eventSession: {
    fontSize: 12,
    marginTop: 2,
  },
});
