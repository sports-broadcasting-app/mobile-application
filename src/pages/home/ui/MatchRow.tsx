import React from 'react';
import { Match, Team } from '@/shared/api/snapshot';
import { describeMatch } from '@/entities/match/lib/accessibility';
import { formatShortDay, formatTime } from '@/shared/lib/date';
import { getTeamName } from '@/shared/lib/teamName';
import { ScheduleRow } from '@/shared/ui/ScheduleRow';

interface MatchRowProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  favorite?: boolean | undefined;
  onPress?: (() => void) | undefined;
}

/** A coming match in one line: day and time, the clubs, the first channel. */
export const MatchRow = React.memo(function MatchRow({
  match,
  homeTeam,
  awayTeam,
  favorite = false,
  onPress,
}: MatchRowProps) {
  const date = new Date(match.startsAt);
  const day = formatShortDay(date);
  const time = formatTime(match.startsAt);

  return (
    <ScheduleRow
      when={`${day} · ${time}`}
      title={`${getTeamName(homeTeam.name)} × ${getTeamName(awayTeam.name)}`}
      favorite={favorite}
      channel={match.channels[0]}
      // Once it started, no channel means none was announced: say nothing.
      showTbd={match.status !== 'live' && match.status !== 'finished'}
      onPress={onPress}
      accessibilityLabel={describeMatch({
        match,
        homeName: homeTeam.name,
        awayName: awayTeam.name,
        favorite,
        details: [day, time],
      })}
      accessibilityHint="Abre os detalhes do jogo"
      testID={`match-row-${match.id}`}
    />
  );
});
