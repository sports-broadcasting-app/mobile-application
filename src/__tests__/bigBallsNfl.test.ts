import {
  addNflScores,
  findNflScore,
  parseNflGames,
} from '../../scripts/bigBalls/nfl';
import type { CompetitionData, Match } from '../types/snapshot';

function bbGame(over: {
  kickoff?: string;
  status?: string;
  home?: [string, number | null, (number | null)[]];
  away?: [string, number | null, (number | null)[]];
}) {
  const [homeName, homeScore, homeLines] = over.home ?? [
    'Dallas Cowboys',
    51,
    [13, 14, 14, 10],
  ];
  const [awayName, awayScore, awayLines] = over.away ?? [
    'Tennessee Titans',
    30,
    [3, 6, 14, 7],
  ];
  return {
    kickoff_utc: over.kickoff ?? '2026-11-22T18:00:00.000Z',
    status: over.status ?? 'finished',
    home: { name: homeName },
    away: { name: awayName },
    score: { home: homeScore, away: awayScore },
    linescore: { home: homeLines, away: awayLines },
  };
}

const answer = (games: object[]) =>
  JSON.stringify({ data: games, meta: {}, error: null });

const cowboys = {
  id: '1',
  name: 'Dallas Cowboys',
  code: 'DAL',
  badgeUrl: null,
};
const titans = {
  id: '2',
  name: 'Tennessee Titans',
  code: 'TEN',
  badgeUrl: null,
};

const match: Match = {
  id: '355700',
  competition: 'nfl',
  startsAt: '2026-11-22T15:00:00-03:00',
  round: 11,
  roundLabel: 'Semana 11',
  homeTeamId: '1',
  awayTeamId: '2',
  status: 'finished',
  homeScore: 51,
  awayScore: 30,
  setScores: [],
  channels: [],
  venue: null,
  city: null,
};

const quarters = [
  { home: 13, away: 3 },
  { home: 14, away: 6 },
  { home: 14, away: 14 },
  { home: 10, away: 7 },
];

describe('parseNflGames', () => {
  it('reads kickoff, status, scores and quarters, stopping at unplayed ones', () => {
    const [game] = parseNflGames(
      answer([
        bbGame({
          status: 'live',
          home: ['Denver Broncos', 10, [3, 7, null, null]],
          away: ['Las Vegas Raiders', 0, [0, 0, null, null]],
        }),
      ]),
    );
    expect(game).toMatchObject({
      status: 'live',
      homeScore: 10,
      homeLines: [3, 7],
      awayLines: [0, 0],
    });
  });

  it('throws on an API error', () => {
    expect(() =>
      parseNflGames(JSON.stringify({ data: null, error: { code: 'plan' } })),
    ).toThrow('plan');
  });
});

describe('findNflScore', () => {
  it('orients to ge home and away whatever the API order', () => {
    const games = parseNflGames(
      answer([
        bbGame({
          home: ['Tennessee Titans', 30, [3, 6, 14, 7]],
          away: ['Dallas Cowboys', 51, [13, 14, 14, 10]],
        }),
      ]),
    );
    expect(
      findNflScore(match, 'Dallas Cowboys', 'Tennessee Titans', games),
    ).toEqual({
      homeScore: 51,
      awayScore: 30,
      periods: quarters,
      finished: true,
    });
  });

  it('ignores games not started and quarters that do not add up', () => {
    const scheduled = parseNflGames(answer([bbGame({ status: 'scheduled' })]));
    expect(
      findNflScore(match, 'Dallas Cowboys', 'Tennessee Titans', scheduled),
    ).toBeNull();
    const wrong = parseNflGames(
      answer([bbGame({ home: ['Dallas Cowboys', 51, [1, 1, 1, 1]] })]),
    );
    expect(
      findNflScore(match, 'Dallas Cowboys', 'Tennessee Titans', wrong),
    ).toBeNull();
  });
});

describe('addNflScores', () => {
  const NOW = Date.parse('2026-11-22T22:00:00Z');
  const competition = (matches: Match[]): CompetitionData => ({
    slug: 'nfl',
    sport: 'futebol-americano',
    name: 'NFL',
    season: '2026',
    teams: [cowboys, titans],
    matches,
    standings: [],
  });

  it('fills the live score and the quarters played so far', async () => {
    const fetchText = jest.fn(async () =>
      answer([
        bbGame({
          status: 'live',
          home: ['Dallas Cowboys', 27, [13, 14, null, null]],
          away: ['Tennessee Titans', 9, [3, 6, null, null]],
        }),
      ]),
    );
    const nfl = competition([
      { ...match, status: 'live', homeScore: null, awayScore: null },
    ]);
    const log = await addNflScores(nfl, undefined, {
      key: 'k',
      now: NOW,
      fetchText,
    });
    expect(fetchText).toHaveBeenCalledWith(
      'https://api.bigballsdata.com/v1/matches?league=nfl&date=2026-11-22&tz=UTC&limit=50',
      'k',
    );
    expect(nfl.matches[0]).toMatchObject({
      homeScore: 27,
      awayScore: 9,
      periodScores: quarters.slice(0, 2),
    });
    expect(log).toContain('1 live');
  });

  it('adds quarters to a finished game and keeps them next time', async () => {
    const nfl = competition([{ ...match }]);
    await addNflScores(nfl, undefined, {
      key: 'k',
      now: NOW,
      fetchText: jest.fn(async () => answer([bbGame({})])),
    });
    expect(nfl.matches[0]!.periodScores).toEqual(quarters);

    const fetchText = jest.fn();
    const next = competition([{ ...match }]);
    await addNflScores(next, nfl, { key: 'k', now: NOW, fetchText });
    expect(fetchText).not.toHaveBeenCalled();
    expect(next.matches[0]!.periodScores).toEqual(quarters);
  });

  it('does nothing without a key and never throws on an API error', async () => {
    const nfl = competition([{ ...match, status: 'live', homeScore: null }]);
    expect(
      await addNflScores(nfl, undefined, {
        key: undefined,
        now: NOW,
        fetchText: jest.fn(),
      }),
    ).toContain('no API key');

    jest.spyOn(console, 'log').mockImplementation(() => {});
    await expect(
      addNflScores(nfl, undefined, {
        key: 'k',
        now: NOW,
        fetchText: jest.fn(async () => {
          throw new Error('403');
        }),
      }),
    ).resolves.toContain('0 live');
    expect(nfl.matches[0]!.homeScore).toBeNull();
  });

  it('gives a finished game its final score when ge has none yet', async () => {
    const nfl = competition([{ ...match, homeScore: null, awayScore: null }]);
    await addNflScores(nfl, undefined, {
      key: 'k',
      now: NOW,
      fetchText: jest.fn(async () => answer([bbGame({})])),
    });
    expect(nfl.matches[0]).toMatchObject({
      homeScore: 51,
      awayScore: 30,
      periodScores: quarters,
    });

    // Next run ge still has no score: kept from the published file.
    const fetchText = jest.fn();
    const next = competition([{ ...match, homeScore: null, awayScore: null }]);
    await addNflScores(next, nfl, { key: 'k', now: NOW, fetchText });
    expect(fetchText).not.toHaveBeenCalled();
    expect(next.matches[0]).toMatchObject({ homeScore: 51, awayScore: 30 });
  });
});
