import { getCompetition } from '@/shared/config/competitions';
import { Match, RaceSession, Team } from '@/shared/api/snapshot';
import { formatTime } from '@/shared/lib/date';
import { getTeamName } from '@/shared/lib/teamName';

/** How long before kickoff the reminder fires. */
export const REMINDER_LEAD_MINUTES = 30;
export const REMINDER_LEAD_MS = REMINDER_LEAD_MINUTES * 60 * 1000;
/** iOS keeps at most 64 pending local notifications per app. */
export const MAX_REMINDERS = 60;

export interface Reminder {
  /** Stable per match, so rescheduling replaces instead of duplicating. */
  id: string;
  matchId: string;
  /** The screen a tap opens ("/match/123", "/grand-prix/gp-do-catar-2026"). */
  path: string;
  fireAt: number;
  title: string;
  body: string;
}

/**
 * One reminder per scheduled match that is still far enough ahead to warn
 * about. Matches whose teams are unknown are skipped.
 */
export function buildReminders(
  matches: Match[],
  teamsById: Map<string, Team>,
  now: number,
): Reminder[] {
  const reminders: Reminder[] = [];

  for (const match of matches) {
    if (match.status !== 'scheduled') continue;
    const fireAt = Date.parse(match.startsAt) - REMINDER_LEAD_MS;
    if (Number.isNaN(fireAt) || fireAt <= now) continue;

    const home = teamsById.get(match.homeTeamId);
    const away = teamsById.get(match.awayTeamId);
    if (!home || !away) continue;

    const where =
      match.channels.length > 0
        ? `Onde passa: ${match.channels.join(', ')}`
        : 'Transmissão a confirmar';

    reminders.push({
      id: `match-${match.id}`,
      matchId: match.id,
      path: `/match/${match.id}`,
      fireAt,
      title: `${getTeamName(home.name)} x ${getTeamName(away.name)} em ${REMINDER_LEAD_MINUTES} min`,
      body: `${getCompetition(match.competition).label} · ${formatTime(match.startsAt)} · ${where}`,
    });
  }

  return sortReminders(reminders);
}

/** Soonest first, within what iOS keeps pending. */
export function sortReminders(reminders: Reminder[]): Reminder[] {
  return [...reminders]
    .sort((a, b) => a.fireAt - b.fireAt)
    .slice(0, MAX_REMINDERS);
}

/**
 * One reminder per scheduled race session (of the kinds the user chose,
 * already filtered by the query) still far enough ahead. A tap opens the
 * weekend.
 */
export function buildSessionReminders(
  sessions: RaceSession[],
  now: number,
): Reminder[] {
  const reminders: Reminder[] = [];
  for (const session of sessions) {
    if (session.status !== 'scheduled') continue;
    const fireAt = Date.parse(session.startsAt) - REMINDER_LEAD_MS;
    if (Number.isNaN(fireAt) || fireAt <= now) continue;
    const where =
      session.channels.length > 0
        ? `Onde passa: ${session.channels.join(', ')}`
        : 'Transmissão a confirmar';
    reminders.push({
      id: `session-${session.id}`,
      matchId: `session-${session.id}`,
      path: `/grand-prix/${session.grandPrixId}`,
      fireAt,
      title: `${session.grandPrix}: ${session.name} em ${REMINDER_LEAD_MINUTES} min`,
      body: `${getCompetition(session.competition).label} · ${formatTime(session.startsAt)} · ${where}`,
    });
  }
  return sortReminders(reminders);
}
