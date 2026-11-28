// The game window lives twice: in the collector (scripts/schedule.ts, which
// rounds a live run asks) and in the Cloudflare Worker (which competitions it
// dispatches). If they disagree, a game is either never collected live or
// collected all night. This runs both over the same games, every 5 minutes
// around every edge, for every sport.
import { decide } from '../infra/cloudflare/data-trigger/worker.js';
import { inLiveWindow, MATCH_LENGTH_MS } from './schedule';
import type { MatchStatus, Sport } from '../src/shared/api/snapshot';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
// 22:00 UTC: away from the 09:00 full run.
const NOW = Date.parse('2026-11-26T22:00:00Z');
const SPORTS = Object.keys(MATCH_LENGTH_MS) as Sport[];
const STATUSES: MatchStatus[] = ['scheduled', 'live', 'finished', 'postponed'];
// From 15 h before now to 1 h after: past the longest live grace (NFL 4 h + 6 h).
const STARTS = Array.from(
  { length: (16 * HOUR_MS) / (5 * MINUTE_MS) + 1 },
  (_, i) => NOW - 15 * HOUR_MS + i * 5 * MINUTE_MS,
);

function workerSays(sport: Sport, status: MatchStatus, startsAt: string) {
  // homeScore set: "finished without a score" is a Worker-only rule (NFL).
  const game = { status, startsAt, homeScore: 0 };
  const entry =
    sport === 'automobilismo'
      ? { slug: 'x', sport, sessions: [game] }
      : { slug: 'x', sport, matches: [game] };
  const file = {
    // Old enough for a live run.
    generatedAt: new Date(NOW - 9 * MINUTE_MS).toISOString(),
    competitions: sport === 'automobilismo' ? [] : [entry],
    series: sport === 'automobilismo' ? [entry] : [],
  };
  return decide(file, NOW) !== null;
}

describe('game window: Worker and collector', () => {
  it.each(SPORTS)('agree for %s', (sport) => {
    const disagreements: string[] = [];
    for (const status of STATUSES) {
      for (const start of STARTS) {
        const startsAt = new Date(start).toISOString();
        const collector = inLiveWindow({ status, startsAt }, sport, NOW);
        if (workerSays(sport, status, startsAt) !== collector) {
          disagreements.push(
            `${status} at ${startsAt}: collector ${collector}`,
          );
        }
      }
    }
    expect(disagreements).toEqual([]);
  });

  it('covers games in and out of the window', () => {
    // Guards the grid itself: a window rule that broke into "always" or
    // "never" would still agree on both sides.
    const inside = STARTS.filter((start) =>
      inLiveWindow(
        { status: 'scheduled', startsAt: new Date(start).toISOString() },
        'futebol',
        NOW,
      ),
    );
    expect(inside.length).toBeGreaterThan(0);
    expect(inside.length).toBeLessThan(STARTS.length);
  });
});
