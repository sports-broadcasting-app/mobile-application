import type { CompetitionData } from '../src/types/snapshot';
import { inLiveWindow, WINDOW_MARGIN_MS } from './schedule.ts';

const HOUR_MS = 60 * 60 * 1000;

/**
 * A competition with a game in its window is collected about every 10
 * minutes; an hour without a new `updatedAt` means its source keeps failing
 * and the fallback keeps publishing old data. In Nov 2026 the women's
 * Superliga stayed frozen for 14 h behind green runs that only warned.
 */
export const STALE_IN_WINDOW_MS = HOUR_MS;

/** Without games it still refreshes in the 06:00 full run, once a day. */
export const STALE_MS = 26 * HOUR_MS;

/**
 * The competitions that stopped updating, as "name (age)", for the run to
 * turn red after publishing. A game whose window opened less than an hour
 * ago does not count: the live run that sees it first may come from a
 * Worker decision made just before, which did not ask for its source.
 */
export function staleCompetitions(
  competitions: CompetitionData[],
  now: number,
): string[] {
  const stale: string[] = [];
  for (const c of competitions) {
    if (!c.updatedAt) continue;
    const age = now - Date.parse(c.updatedAt);
    const busy = [...c.matches, ...(c.sessions ?? [])].some(
      (game) =>
        inLiveWindow(game, c.sport, now) &&
        now - (Date.parse(game.startsAt) - WINDOW_MARGIN_MS) >=
          STALE_IN_WINDOW_MS,
    );
    if ((busy && age >= STALE_IN_WINDOW_MS) || age >= STALE_MS) {
      stale.push(`${c.name} (${(age / HOUR_MS).toFixed(1)} h)`);
    }
  }
  return stale;
}
