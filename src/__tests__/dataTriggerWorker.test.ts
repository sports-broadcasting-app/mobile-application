// The Cloudflare Worker that starts the collection (pasted in the dashboard).
import { decide } from '../../infra/cloudflare/data-trigger/worker.js';

const at = (iso: string) => Date.parse(iso);

function snapshot(generatedAt: string, matches: object[]) {
  return {
    generatedAt,
    competitions: [{ slug: 'nfl', sport: 'futebol-americano', matches }],
  };
}

describe('data trigger Worker', () => {
  it('runs the full collection at 06:00 Brasília', () => {
    expect(
      decide(snapshot('2026-11-24T08:00:00Z', []), at('2026-11-24T09:00:00Z')),
    ).toEqual({ mode: 'full', competitions: '' });
    expect(
      decide(snapshot('2026-11-24T08:00:00Z', []), at('2026-11-24T09:05:00Z')),
    ).toBeNull();
  });

  it('runs live about every 10 minutes while a game is in its window', () => {
    const game = {
      status: 'scheduled',
      startsAt: '2026-11-24T18:00:00-03:00',
      homeScore: null,
    };
    const now = at('2026-11-24T21:30:00Z'); // 18:30 Brasília
    expect(decide(snapshot('2026-11-24T21:21:00Z', [game]), now)).toEqual({
      mode: 'live',
      competitions: 'nfl',
    });
    // Published 5 minutes ago: wait.
    expect(decide(snapshot('2026-11-24T21:25:00Z', [game]), now)).toBeNull();
  });

  it('does nothing outside game windows and catches up a missed morning', () => {
    const game = {
      status: 'scheduled',
      startsAt: '2026-11-24T22:00:00-03:00',
      homeScore: null,
    };
    expect(
      decide(
        snapshot('2026-11-24T09:02:00Z', [game]),
        at('2026-11-24T15:00:00Z'),
      ),
    ).toBeNull();
    expect(
      decide(
        snapshot('2026-11-23T09:02:00Z', [game]),
        at('2026-11-24T12:00:00Z'),
      ),
    ).toEqual({ mode: 'full', competitions: '' });
  });

  it('keeps going for a game marked finished while its score is missing', () => {
    const game = {
      status: 'finished',
      startsAt: '2026-11-24T15:00:00-03:00',
      homeScore: null,
    };
    expect(
      decide(
        snapshot('2026-11-24T22:40:00Z', [game]),
        at('2026-11-24T22:50:00Z'),
      ),
    ).toEqual({ mode: 'live', competitions: 'nfl' });
  });
});
