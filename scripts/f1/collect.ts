import type { CompetitionData, RaceSession } from '../../src/types/snapshot';
import { brasiliaDate } from '../broadcasts.ts';
import { inLiveWindow } from '../schedule.ts';
import { parseAgenda } from './parseGe.ts';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
/** How far ahead a full run looks: the next four race weekends at most. */
const HORIZON_DAYS = 28;
/**
 * Sessions run from Thursday night (Brasília time, for the Asian rounds)
 * to Sunday; the other days are never asked.
 */
const RACE_WEEKDAYS = new Set([4, 5, 6, 0]);
/** A session nobody asked again this long after its start is over. */
const OVER_AFTER_MS = 6 * HOUR_MS;
/** Sessions older than this leave the file. */
const KEEP_FOR_MS = 400 * DAY_MS;

export interface F1Options {
  now: number;
  /** The Formula 1 entry of the published file. */
  previous: CompetitionData | undefined;
  /** Live run: only the dates with a session in its window. */
  live: boolean;
  /** The agenda of one Brasília date, or null when there is none (offline). */
  fetchAgenda: (date: string) => Promise<string | null>;
}

/** `YYYY-MM-DD` plus `days`, as calendar dates (no time zone involved). */
function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

/**
 * The Brasília dates to ask. A full run: from yesterday (to close sessions
 * that ran past midnight) to four weeks ahead, race weekdays only. A live
 * run: the dates of the published sessions in their window.
 */
export function datesToAsk(
  now: number,
  previous: CompetitionData | undefined,
  live: boolean,
): string[] {
  if (live && previous) {
    const dates = (previous.sessions ?? [])
      .filter((s) => inLiveWindow(s, 'automobilismo', now))
      .map((s) => brasiliaDate(s.startsAt));
    return [...new Set(dates)].sort();
  }
  const today = brasiliaDate(new Date(now).toISOString());
  const dates: string[] = [];
  for (let i = -1; i < HORIZON_DAYS; i++) {
    const date = addDays(today, i);
    if (RACE_WEEKDAYS.has(weekday(date))) dates.push(date);
  }
  return dates;
}

/** The season shown: the year of the next session, else of the last one. */
function seasonOf(sessions: RaceSession[], now: number): string {
  const next = sessions.find((s) => Date.parse(s.startsAt) >= now);
  const pick = next ?? sessions[sessions.length - 1];
  return pick ? pick.startsAt.slice(0, 4) : String(new Date(now).getFullYear());
}

/**
 * Formula 1 from the ge agenda. Dates asked replace what was published for
 * them (a session ge moved or dropped goes away); every other session is
 * kept from the published file, so the season builds up run after run.
 */
export async function collectF1({
  now,
  previous,
  live,
  fetchAgenda,
}: F1Options): Promise<CompetitionData> {
  const dates = datesToAsk(now, previous, live);
  const fetched = new Map<string, RaceSession>();
  const answered = new Set<string>();
  for (const date of dates) {
    const json = await fetchAgenda(date);
    if (json === null) continue;
    answered.add(date);
    for (const session of parseAgenda(json, 'f1')) {
      fetched.set(session.id, session);
    }
  }

  // ge answering the dates of published sessions with none at all is a
  // broken answer, not a cancelled weekend: keep the published file.
  const expected = (previous?.sessions ?? []).filter((s) =>
    answered.has(brasiliaDate(s.startsAt)),
  ).length;
  if (fetched.size === 0 && expected > 0) {
    throw new Error(
      `F1: no session in the ge agenda for dates that had ${expected}`,
    );
  }

  const kept = (previous?.sessions ?? [])
    .filter(
      (s) =>
        !fetched.has(s.id) &&
        !answered.has(brasiliaDate(s.startsAt)) &&
        now - Date.parse(s.startsAt) < KEEP_FOR_MS,
    )
    .map((s): RaceSession => {
      const over =
        (s.status === 'scheduled' || s.status === 'live') &&
        now - Date.parse(s.startsAt) > OVER_AFTER_MS;
      return over ? { ...s, status: 'finished' } : s;
    });

  const sessions = [...kept, ...fetched.values()].sort(
    (a, b) =>
      Date.parse(a.startsAt) - Date.parse(b.startsAt) ||
      a.id.localeCompare(b.id),
  );
  console.log(
    `F1: ${dates.length} dates asked, ${fetched.size} sessions fetched, ${kept.length} kept`,
  );

  return {
    slug: 'f1',
    sport: 'automobilismo',
    name: 'Fórmula 1',
    season: seasonOf(sessions, now),
    teams: [],
    matches: [],
    standings: [],
    sessions,
  };
}
