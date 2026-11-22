import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import type { MatchEvent, Team } from '../types/snapshot';
import {
  describeEvent,
  eventPeriods,
  formatMinute,
  periodName,
} from '../utils/matchEvents';
import { getTeamName } from '../utils/teamName';
import {
  iconSize,
  maxFontScale,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

interface MatchTimelineProps {
  events: MatchEvent[];
  homeTeam: Team;
  awayTeam: Team;
}

function EventIcon({ type }: { type: MatchEvent['type'] }) {
  const { colors } = useTheme();
  if (type === 'red-card') {
    return (
      <View
        testID="red-card-icon"
        style={[styles.card, { backgroundColor: colors.redCard }]}
      />
    );
  }
  return (
    <MaterialCommunityIcons
      name="soccer"
      size={iconSize.sm}
      color={type === 'own-goal' ? colors.textSecondary : colors.textPrimary}
    />
  );
}

/**
 * Goals and red cards by period: the minute in the middle, home events on
 * the left and away events on the right. An own goal sits on the side it
 * counts for, marked "(contra)".
 */
export function MatchTimeline({
  events,
  homeTeam,
  awayTeam,
}: MatchTimelineProps) {
  const { colors } = useTheme();

  return (
    <View
      testID="match-timeline"
      style={[styles.timeline, { backgroundColor: colors.surface }]}
    >
      {eventPeriods(events).map((period) => {
        const inPeriod = events.filter((e) => e.period === period);
        return (
          <Fragment key={period}>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={maxFontScale}
              style={[styles.period, { color: colors.textTertiary }]}
            >
              {periodName(period)}
            </Text>
            {inPeriod.length === 0 && (
              <Text style={[styles.nothing, { color: colors.textTertiary }]}>
                Sem gols nem expulsões
              </Text>
            )}
            {inPeriod.map((event, index) => {
              const team = event.side === 'home' ? homeTeam : awayTeam;
              const label =
                event.type === 'own-goal'
                  ? `${event.player} (contra)`
                  : event.player;
              const content = (
                <View
                  style={[
                    styles.content,
                    event.side === 'away' && styles.contentAway,
                  ]}
                >
                  <EventIcon type={event.type} />
                  <Text
                    maxFontSizeMultiplier={maxFontScale}
                    numberOfLines={2}
                    style={[
                      styles.player,
                      { color: colors.textPrimary },
                      event.side === 'home' && styles.playerHome,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              );
              return (
                <View
                  key={`${period}-${index}`}
                  accessible
                  accessibilityLabel={describeEvent(
                    event,
                    getTeamName(team.name),
                  )}
                  testID={`timeline-event-${period}-${index}`}
                  style={styles.row}
                >
                  <View style={styles.side}>
                    {event.side === 'home' && content}
                  </View>
                  <View
                    style={[
                      styles.minute,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <Text
                      maxFontSizeMultiplier={maxFontScale}
                      style={[
                        styles.minuteText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {formatMinute(event)}
                    </Text>
                  </View>
                  <View style={styles.side}>
                    {event.side === 'away' && content}
                  </View>
                </View>
              );
            })}
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.md,
  },
  period: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.5,
    marginTop: spacing.xs,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  nothing: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  side: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: spacing.xs,
  },
  contentAway: {
    flexDirection: 'row',
  },
  player: {
    flexShrink: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  playerHome: {
    textAlign: 'right',
  },
  minute: {
    alignItems: 'center',
    borderRadius: radius.sm,
    minWidth: 48,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  minuteText: {
    fontSize: typography.size.sm,
    fontVariant: ['tabular-nums'],
    fontWeight: typography.weight.bold,
  },
  card: {
    borderRadius: 2,
    height: 14,
    width: 10,
  },
});
