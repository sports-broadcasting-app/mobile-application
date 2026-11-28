import React from 'react';
import { RaceSession } from '@/shared/api/snapshot';
import { formatShortDay, formatTime } from '@/shared/lib/date';
import { describeSession } from '../lib/sessions';
import { ScheduleRow } from '@/shared/ui/ScheduleRow';

interface SessionRowProps {
  session: RaceSession;
  onPress?: (() => void) | undefined;
}

/** A coming race session in one line, like MatchRow: day, time, the GP. */
export const SessionRow = React.memo(function SessionRow({
  session,
  onPress,
}: SessionRowProps) {
  const day = formatShortDay(new Date(session.startsAt));

  return (
    <ScheduleRow
      when={`${day} · ${formatTime(session.startsAt)}`}
      title={`${session.grandPrix} · ${session.name}`}
      titleLines={2}
      channel={session.channels[0]}
      onPress={onPress}
      accessibilityLabel={describeSession(session, [day])}
      accessibilityHint="Abre o fim de semana do GP"
      testID={`session-row-${session.id}`}
    />
  );
});
