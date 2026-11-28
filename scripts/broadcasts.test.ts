import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  applyBroadcasts,
  brasiliaDate,
  type BroadcastFile,
} from './broadcasts';
import type { CompetitionData, Match } from '../src/shared/api/snapshot';

const rams = { id: '1', name: 'Los Angeles Rams', code: 'LAR', badgeUrl: null };
const packers = {
  id: '2',
  name: 'Green Bay Packers',
  code: 'GB',
  badgeUrl: null,
};

const game: Match = {
  id: 'm1',
  competition: 'nfl',
  // 22:00 in Brasília is 01:00 UTC of the next day.
  startsAt: '2026-11-25T22:00:00-03:00',
  round: 12,
  roundLabel: 'Semana 12',
  homeTeamId: '1',
  awayTeamId: '2',
  status: 'scheduled',
  homeScore: null,
  awayScore: null,
  setScores: [],
  channels: [],
  venue: null,
  city: null,
};

const nfl = (matches: Match[]): CompetitionData => ({
  slug: 'nfl',
  sport: 'futebol-americano',
  name: 'NFL',
  season: '2026',
  teams: [rams, packers],
  matches,
  standings: [],
});

const line = {
  date: '2026-11-25',
  home: 'LAR',
  away: 'GB',
  channels: ['Netflix'],
  source: 'https://example.com/nfl-netflix',
};

describe('brasiliaDate', () => {
  it('gives the Brasília day, not the UTC one', () => {
    expect(brasiliaDate('2026-11-26T01:00:00Z')).toBe('2026-11-25');
    expect(brasiliaDate('2026-11-25T22:30:00+01:00')).toBe('2026-11-25');
  });
});

describe('applyBroadcasts', () => {
  it('adds the curated broadcaster to the game of that day', () => {
    const competition = nfl([{ ...game, channels: [] }]);
    const log = applyBroadcasts([competition], { nfl: [line] });
    expect(competition.matches[0]!.channels).toEqual(['Netflix']);
    expect(log).toEqual(['NFL: 1 curated broadcasts']);
  });

  it('keeps the source broadcasters first and never repeats one', () => {
    const competition = nfl([{ ...game, channels: ['SporTV', 'Netflix'] }]);
    applyBroadcasts([competition], {
      nfl: [{ ...line, channels: ['Netflix', 'Prime Video'] }],
    });
    expect(competition.matches[0]!.channels).toEqual([
      'SporTV',
      'Netflix',
      'Prime Video',
    ]);
  });

  it('finds the game with the teams in either order or by full name', () => {
    const competition = nfl([{ ...game, channels: [] }]);
    applyBroadcasts([competition], {
      nfl: [{ ...line, home: 'Green Bay Packers', away: 'lar' }],
    });
    expect(competition.matches[0]!.channels).toEqual(['Netflix']);
  });

  it('only warns when the game is not in the snapshot', () => {
    const competition = nfl([{ ...game, channels: [] }]);
    const log = applyBroadcasts([competition], {
      nfl: [{ ...line, date: '2026-11-26' }],
    });
    expect(competition.matches[0]!.channels).toEqual([]);
    expect(log[0]).toMatch(/^::warning::.*no LAR x GB game on 2026-11-26/);
  });

  it('rejects doubtful lines', () => {
    const run = (over: object) => () =>
      applyBroadcasts([nfl([{ ...game }])], { nfl: [{ ...line, ...over }] });
    expect(run({ source: 'ncnews' })).toThrow('source');
    expect(run({ date: '25/11/2026' })).toThrow('date');
    expect(run({ channels: [] })).toThrow('channels');
    expect(run({ home: 'XYZ' })).toThrow('team code');
  });
});

describe('scripts/broadcasts.json', () => {
  const file = JSON.parse(
    readFileSync(join(__dirname, 'broadcasts.json'), 'utf8'),
  ) as BroadcastFile;

  it('has a date, two teams, broadcasters and a source on every line', () => {
    for (const entries of Object.values(file)) {
      for (const entry of entries ?? []) {
        expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(entry.home.trim()).not.toBe('');
        expect(entry.away.trim()).not.toBe('');
        expect(entry.channels.length).toBeGreaterThan(0);
        expect(entry.source).toMatch(/^https?:\/\//);
      }
    }
  });
});
