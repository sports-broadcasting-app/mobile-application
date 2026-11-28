import {
  anyInLiveWindow,
  inLiveWindow,
  liveCompetitions,
  planSources,
} from './schedule';
import type { Match } from '../src/shared/api/snapshot';

const NOW = Date.parse('2026-11-22T20:00:00-03:00');

function game(startsAt: string, status: Match['status'] = 'scheduled'): Match {
  return {
    id: startsAt,
    competition: 'serie-a',
    startsAt,
    round: 1,
    roundLabel: '1ª rodada',
    homeTeamId: 'a',
    awayTeamId: 'b',
    status,
    homeScore: null,
    awayScore: null,
    setScores: [],
    channels: [],
    venue: null,
    city: null,
  };
}

describe('inLiveWindow', () => {
  it('opens 30 min before kickoff and closes 30 min after the expected end', () => {
    expect(
      inLiveWindow(game('2026-11-22T20:25:00-03:00'), 'futebol', NOW),
    ).toBe(true);
    expect(
      inLiveWindow(game('2026-11-22T20:31:00-03:00'), 'futebol', NOW),
    ).toBe(false);
    // Football: 2.5 h + 30 min after 17:00 is 20:00.
    expect(
      inLiveWindow(game('2026-11-22T17:00:00-03:00'), 'futebol', NOW),
    ).toBe(true);
    expect(
      inLiveWindow(game('2026-11-22T16:59:00-03:00'), 'futebol', NOW),
    ).toBe(false);
  });

  it('follows the status: live in past the end, finished and postponed out', () => {
    expect(
      inLiveWindow(game('2026-11-22T15:00:00-03:00', 'live'), 'futebol', NOW),
    ).toBe(true);
    expect(
      inLiveWindow(
        game('2026-11-22T19:30:00-03:00', 'finished'),
        'futebol',
        NOW,
      ),
    ).toBe(false);
    expect(
      inLiveWindow(
        game('2026-11-22T20:10:00-03:00', 'postponed'),
        'futebol',
        NOW,
      ),
    ).toBe(false);
  });

  it('lets go of a game left live at the source', () => {
    // Football: 2.5 h + 6 h after 11:00 is 19:30, before NOW (20:00).
    expect(
      inLiveWindow(game('2026-11-22T11:00:00-03:00', 'live'), 'futebol', NOW),
    ).toBe(false);
    expect(
      inLiveWindow(game('2026-11-21T18:30:00-03:00', 'live'), 'volei', NOW),
    ).toBe(false);
  });

  it('uses the length of each sport', () => {
    // NFL: 4 h + 30 min after 15:30 is 20:00.
    expect(
      anyInLiveWindow(
        [game('2026-11-22T15:30:00-03:00')],
        'futebol-americano',
        NOW,
      ),
    ).toBe(true);
  });
});

describe('liveCompetitions', () => {
  it('reads the live list and falls back to a full run', () => {
    expect(liveCompetitions('live', 'nfl, nba')).toEqual(
      new Set(['nfl', 'nba']),
    );
    expect(liveCompetitions('live', '')).toBeNull();
    expect(liveCompetitions('full', 'nfl')).toBeNull();
    expect(liveCompetitions(undefined, undefined)).toBeNull();
  });
});

describe('planSources', () => {
  const sources = [
    { name: 'CBV', slugs: ['masculina', 'feminina'] },
    { name: 'ge', slugs: ['serie-a'] },
    { name: 'NFL', slugs: ['nfl'] },
  ];
  const previous = {
    competitions: [
      { slug: 'masculina' },
      { slug: 'feminina' },
      { slug: 'serie-a' },
      { slug: 'nfl' },
    ],
  };

  it('collects everything in a full run', () => {
    expect(planSources(sources, null, previous).collect).toHaveLength(3);
  });

  it('collects only listed sources in a live run and keeps the rest', () => {
    const plan = planSources(sources, new Set(['nfl']), previous);
    expect(plan.collect.map((s) => s.name)).toEqual(['NFL']);
    expect(plan.kept.map((c) => c.slug)).toEqual([
      'masculina',
      'feminina',
      'serie-a',
    ]);
  });

  it('collects a source never published, even when not listed', () => {
    const plan = planSources(sources, new Set(['nfl']), {
      competitions: previous.competitions.filter((c) => c.slug !== 'serie-a'),
    });
    expect(plan.collect.map((s) => s.name)).toEqual(['ge', 'NFL']);
  });
});
