import { addNbaQuarters, parseNbaGames } from './nba';
import { findGameScore, periodsMatchScore } from '../periodScores';
import type { CompetitionData, Match } from '../../src/shared/api/snapshot';

/** An API-NBA v2 game, trimmed to what the parser reads. */
function apiGame(over: {
  start?: string;
  status?: string;
  home?: [string, string, string[]];
  away?: [string, string, string[]];
}) {
  const [homeName, homeCode, homeLines] = over.home ?? [
    'Sacramento Kings',
    'SAC',
    ['20', '25', '30', '22'],
  ];
  const [awayName, awayCode, awayLines] = over.away ?? [
    'Boston Celtics',
    'BOS',
    ['24', '26', '20', '26'],
  ];
  return {
    date: { start: over.start ?? '2026-11-22T03:00:00.000Z' },
    status: { long: over.status ?? 'Finished' },
    teams: {
      home: { name: homeName, code: homeCode },
      visitors: { name: awayName, code: awayCode },
    },
    scores: {
      home: { linescore: homeLines, points: 97 },
      visitors: { linescore: awayLines, points: 96 },
    },
  };
}

const answer = (games: object[], errors: unknown = []) =>
  JSON.stringify({ errors, results: games.length, response: games });

const kings = {
  id: '4686',
  name: 'Sacramento Kings',
  code: 'SAC',
  badgeUrl: null,
};
const celtics = {
  id: '4604',
  name: 'Boston Celtics',
  code: 'BOS',
  badgeUrl: null,
};

const match: Match = {
  id: '358248',
  competition: 'nba',
  startsAt: '2026-11-22T00:00:00-03:00',
  round: 32,
  roundLabel: 'Temporada regular',
  homeTeamId: '4686',
  awayTeamId: '4604',
  status: 'finished',
  homeScore: 97,
  awayScore: 96,
  setScores: [],
  channels: [],
  venue: null,
  city: null,
};

const quarters = [
  { home: 20, away: 24 },
  { home: 25, away: 26 },
  { home: 30, away: 20 },
  { home: 22, away: 26 },
];

describe('parseNbaGames', () => {
  it('reads teams, start, status and line scores', () => {
    const [game] = parseNbaGames(answer([apiGame({})]));
    expect(game).toMatchObject({
      status: 'finished',
      home: { code: 'SAC' },
      away: { name: 'Boston Celtics' },
      homeLines: [20, 25, 30, 22],
      awayLines: [24, 26, 20, 26],
    });
  });

  it('throws on an API error such as a plan or quota message', () => {
    expect(() =>
      parseNbaGames(answer([], { plan: 'Free plans do not have access' })),
    ).toThrow('Free plans');
  });
});

describe('findGameScore with API-NBA games', () => {
  it('orients the quarters to ge home and away, whatever the API order', () => {
    const games = parseNbaGames(
      answer([
        apiGame({
          home: ['Boston Celtics', 'BOS', ['24', '26', '20', '26']],
          away: ['Sacramento Kings', 'SAC', ['20', '25', '30', '22']],
        }),
      ]),
    );
    expect(findGameScore(match, kings, celtics, games)?.periods).toEqual(
      quarters,
    );
  });

  it('keeps overtime as extra periods', () => {
    const games = parseNbaGames(
      answer([
        apiGame({
          home: ['Sacramento Kings', 'SAC', ['20', '25', '30', '15', '7']],
          away: ['Boston Celtics', 'BOS', ['24', '26', '20', '20', '6']],
        }),
      ]),
    );
    expect(findGameScore(match, kings, celtics, games)?.periods).toHaveLength(
      5,
    );
  });

  it('ignores unfinished games and quarters that do not add up', () => {
    const live = parseNbaGames(answer([apiGame({ status: 'In Play' })]));
    expect(findGameScore(match, kings, celtics, live)).toBeNull();
    const wrong = parseNbaGames(
      answer([
        apiGame({ home: ['Sacramento Kings', 'SAC', ['1', '1', '1', '1']] }),
      ]),
    );
    // API-NBA has no total: the quarters are checked against ge's score.
    const found = findGameScore(match, kings, celtics, wrong);
    expect(
      periodsMatchScore(found!.periods, match.homeScore, match.awayScore),
    ).toBe(false);
  });
});

describe('periodsMatchScore', () => {
  it('needs at least four periods adding up to the score', () => {
    expect(periodsMatchScore(quarters, 97, 96)).toBe(true);
    expect(periodsMatchScore(quarters.slice(0, 3), 75, 70)).toBe(false);
    expect(periodsMatchScore(quarters, 97, 95)).toBe(false);
  });
});

describe('addNbaQuarters', () => {
  const NOW = Date.parse('2026-11-22T12:00:00Z');
  const competition = (matches: Match[]): CompetitionData => ({
    slug: 'nba',
    sport: 'basquete',
    name: 'NBA',
    season: '2026',
    teams: [kings, celtics],
    matches,
    standings: [],
  });

  it('asks the UTC date of the game once and adds its quarters', async () => {
    const fetchText = jest.fn(async () => answer([apiGame({})]));
    const nba = competition([{ ...match }]);
    const log = await addNbaQuarters(nba, undefined, {
      key: 'k',
      now: NOW,
      fetchText,
    });
    expect(fetchText).toHaveBeenCalledTimes(1);
    expect(fetchText).toHaveBeenCalledWith(
      'https://v2.nba.api-sports.io/games?date=2026-11-22',
      'k',
    );
    expect(nba.matches[0]!.periodScores).toEqual(quarters);
    expect(log).toBe('NBA quarters: 1 date(s) asked, 1 added, 0 kept');
  });

  it('reuses published quarters without asking again', async () => {
    const fetchText = jest.fn();
    const nba = competition([{ ...match }]);
    await addNbaQuarters(
      nba,
      competition([{ ...match, periodScores: quarters }]),
      {
        key: 'k',
        now: NOW,
        fetchText,
      },
    );
    expect(fetchText).not.toHaveBeenCalled();
    expect(nba.matches[0]!.periodScores).toEqual(quarters);
  });

  it('does nothing without a key and never throws on an API error', async () => {
    const nba = competition([{ ...match }]);
    const noKey = await addNbaQuarters(nba, undefined, {
      key: undefined,
      now: NOW,
      fetchText: jest.fn(),
    });
    expect(noKey).toContain('no API key');

    jest.spyOn(console, 'log').mockImplementation(() => {});
    const failing = jest.fn(async () =>
      answer([], { requests: 'limit reached' }),
    );
    await expect(
      addNbaQuarters(nba, undefined, {
        key: 'k',
        now: NOW,
        fetchText: failing,
      }),
    ).resolves.toContain('0 added');
    expect(nba.matches[0]!.periodScores).toBeUndefined();
  });

  it('skips games older than the lookback window', async () => {
    const fetchText = jest.fn();
    const old = { ...match, startsAt: '2026-11-18T00:00:00-03:00' };
    await addNbaQuarters(competition([old]), undefined, {
      key: 'k',
      now: NOW,
      fetchText,
    });
    expect(fetchText).not.toHaveBeenCalled();
  });
});
