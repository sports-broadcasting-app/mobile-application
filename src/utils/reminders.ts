import { getCompetition } from '../constants/competitions';
import { Match, Team } from '../types/snapshot';
import { formatTime } from './date';
import { getTeamName } from './teamName';

/** How long before kickoff the reminder fires. */
export const REMINDER_LEAD_MINUTES = 30;
export const REMINDER_LEAD_MS = REMINDER_LEAD_MINUTES * 60 * 1000;
/** iOS keeps at most 64 pending local notifications per app. */
export const MAX_REMINDERS = 60;

export interface Reminder {
  /** Stable per match, so rescheduling replaces instead of duplicating. */
  id: string;
  matchId: string;
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
      fireAt,
      title: `${getTeamName(home.name)} x ${getTeamName(away.name)} em ${REMINDER_LEAD_MINUTES} min`,
      body: `${getCompetition(match.competition).label} · ${formatTime(match.startsAt)} · ${where}`,
    });
  }

  return reminders.sort((a, b) => a.fireAt - b.fireAt).slice(0, MAX_REMINDERS);
}
