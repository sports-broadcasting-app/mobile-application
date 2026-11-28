import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/shared/ui/Card';
import { AppText } from '@/shared/ui/AppText';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { MatchEvent, Team } from '@/shared/api/snapshot';
import {
  describeEvent,
  eventPeriods,
  formatMinute,
  periodName,
} from '@/entities/match/lib/matchEvents';
import { getTeamName } from '@/shared/lib/teamName';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '@/shared/theme/designTokens';

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
    <Card testID="match-timeline" style={styles.timeline}>
      {eventPeriods(events).map((period) => {
        const inPeriod = events.filter((e) => e.period === period);
        return (
          <Fragment key={period}>
            <AppText
              tone="tertiary"
              accessibilityRole="header"
              capped
              style={styles.period}
            >
              {periodName(period)}
            </AppText>
            {inPeriod.length === 0 && (
              <AppText variant="caption" tone="tertiary" style={styles.nothing}>
                Sem gols nem expulsões
              </AppText>
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
                  <AppText
                    capped
                    numberOfLines={2}
                    style={[
                      styles.player,
                      { color: colors.textPrimary },
                      event.side === 'home' && styles.playerHome,
                    ]}
                  >
                    {label}
                  </AppText>
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
                    <AppText tone="secondary" capped style={styles.minuteText}>
                      {formatMinute(event)}
                    </AppText>
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
    </Card>
  );
}

const styles = StyleSheet.create({
  timeline: {
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
