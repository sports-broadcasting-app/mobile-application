import { parseMatches, parseStandingsPage } from './parseGe';
import { canReuse, needsFullRefresh } from './collect';
import { NFL_TEAM_CODES } from '../nfl/collect';
import type { CompetitionData, Match } from '../../src/shared/api/snapshot';

const NOW = Date.parse('2026-11-16T12:00:00-03:00');

function team(id: number, name: string, abbreviation: string) {
  return {
    __typename: 'Team',
    id,
    name,
    popularName: name,
    abbreviation,
    badge: `https://s.sde.globo.com/${abbreviation}.svg`,
  };
}

function rating(order: number, contestant: object, wins: number) {
  return {
    order,
    standingColumns: [
      { slug: 'vitorias', value: wins },
      { slug: 'derrotas', value: 9 - wins },
      { slug: 'empates', value: 0 },
      { slug: 'jogos', value: 9 },
      { slug: 'pontos-a-favor', value: 200 + wins },
      { slug: 'pontos-contra', value: 180 },
      { slug: 'diferenca', value: 20 + wins },
    ],
    contestant: { label: 'x', contestantData: contestant },
  };
}

const context = {
  getStandingData: {
    body: {
      standings: {
        championshipEdition: {
          name: 'NFL 2026/2027',
          slug: 'nfl-2026-2027',
          championship: { slug: 'nfl' },
        },
        sport: { slug: 'futebol-americano' },
        category: { slug: 'futebol-americano-masculino' },
        modality: { slug: 'futebol-americano-de-campo' },
        multisportStandings: [
          {
            phase: {
              name: 'Temporada regular',
              slug: 'temporada-regular-nfl-2026-2027',
              actual: true,
            },
            standing: [
              {
                __typename: 'GroupedRoundRobinStandingData',
                name: 'AFC Leste',
                totalRounds: 18,
                ratings: [
                  rating(1, team(6920, 'Buffalo Bills', 'BUF'), 8),
                  rating(2, team(6931, 'New England Patriots', 'NEP'), 5),
                ],
              },
              {
                __typename: 'GroupedRoundRobinStandingData',
                name: 'NFC Oeste',
                totalRounds: 18,
                ratings: [
                  rating(1, team(6916, 'Seattle Seahawks', 'SEA'), 7),
                  rating(2, team(6935, 'San Francisco 49ers', 'SF4'), 6),
                ],
              },
            ],
          },
          {
            phase: {
              name: 'Playoffs de Wildcard',
              slug: 'playoffs-de-wildcard-nfl-2026-2027',
              actual: false,
            },
            standing: [{ __typename: 'KnockoutStandingData', brackets: [] }],
          },
        ],
      },
    },
  },
};

function page(data: object = context): string {
  return `<html><div id="root"></div><script id="tabela-context" type="application/json">${JSON.stringify(data)}</script></html>`;
}

function rawMatch(overrides: Record<string, unknown> = {}) {
  return {
    __typename: 'MatchEventKind',
    match: {
      id: 355769,
      startDate: '2026-11-19',
      startHour: '22:15:00',
      round: 11,
      moment: 'FUTURE',
      firstContestant: team(6924, 'Houston Texans', 'HOU'),
      secondContestant: team(6925, 'Indianapolis Colts', 'IND'),
      scoreboard: { home: null, away: null },
      location: { name: 'NRG Stadium', popularName: 'Houston' },
      phase: { name: 'Temporada regular' },
      liveWatchSources: [
        { name: 'sportv' },
        { name: 'globoplay' },
        { name: 'Ge TV' },
      ],
      ...overrides,
    },
  };
}

function response(items: unknown[]): string {
  return JSON.stringify({ data: { multisportMatchesByPhase: items } });
}

describe('parseStandingsPage', () => {
  it('reads the season, the slugs and the phases', () => {
    const parsed = parseStandingsPage(page());
    expect(parsed.season).toBe('2026/27');
    expect(parsed.filter).toEqual({
      championshipSlug: 'nfl',
      championshipEditionSlug: 'nfl-2026-2027',
      sportSlug: 'futebol-americano',
      modalitySlug: 'futebol-americano-de-campo',
      categorySlug: 'futebol-americano-masculino',
    });
    expect(parsed.phases).toEqual([
      {
        slug: 'temporada-regular-nfl-2026-2027',
        name: 'Temporada regular',
        knockout: false,
        actual: true,
        rounds: 18,
      },
      {
        slug: 'playoffs-de-wildcard-nfl-2026-2027',
        name: 'Playoffs de Wildcard',
        knockout: true,
        actual: false,
        rounds: 1,
      },
    ]);
  });

  it('keeps the table by division, in page order', () => {
    const { teams, standings } = parseStandingsPage(page(), NFL_TEAM_CODES);
    expect(teams.map((t) => t.code)).toEqual(['BUF', 'NE', 'SEA', 'SF']);
    expect(standings.map((s) => [s.group, s.position, s.teamId])).toEqual([
      ['AFC Leste', 1, '6920'],
      ['AFC Leste', 2, '6931'],
      ['NFC Oeste', 1, '6916'],
      ['NFC Oeste', 2, '6935'],
    ]);
    expect(standings[0]).toMatchObject({
      points: 0,
      matches: 9,
      wins: 8,
      draws: 0,
      losses: 1,
      scoredFor: 208,
      scoredAgainst: 180,
    });
  });

  it('refuses a page without the table context', () => {
    expect(() => parseStandingsPage('<html></html>')).toThrow(
      'table context not found',
    );
    expect(() => parseStandingsPage(page({}))).toThrow('slugs not found');
  });
});

describe('parseMatches', () => {
  it('parses a scheduled game with Brasília time and its channels', () => {
    const { matches, teams } = parseMatches(
      response([rawMatch()]),
      { number: 11, label: 'Semana 11' },
      'nfl',
      NOW,
    );
    expect(teams.map((t) => t.code)).toEqual(['HOU', 'IND']);
    expect(matches).toEqual([
      {
        id: '355769',
        competition: 'nfl',
        startsAt: '2026-11-19T22:15:00-03:00',
        round: 11,
        roundLabel: 'Semana 11',
        homeTeamId: '6924',
        awayTeamId: '6925',
        status: 'scheduled',
        homeScore: null,
        awayScore: null,
        setScores: [],
        channels: ['SporTV', 'Globoplay', 'GE TV'],
        venue: 'NRG Stadium',
        city: null,
      },
    ]);
  });

  it('marks finished and live games with their score', () => {
    const { matches } = parseMatches(
      response([
        rawMatch({
          id: 1,
          moment: 'PAST',
          scoreboard: { home: 21, away: 24 },
          liveWatchSources: [],
        }),
        rawMatch({
          id: 2,
          startDate: '2026-11-16',
          startHour: '11:00:00',
          scoreboard: { home: 7, away: 3 },
        }),
        rawMatch({ id: 3, startDate: '2026-11-15', startHour: '11:00:00' }),
      ]),
      { number: 10, label: 'Semana 10' },
      'nfl',
      NOW,
    );
    expect(matches.map((m) => [m.status, m.homeScore, m.awayScore])).toEqual([
      ['finished', 21, 24],
      ['live', 7, 3],
      ['finished', null, null],
    ]);
    expect(matches[0]!.channels).toEqual([]);
  });

  it('skips a game without a date or a team', () => {
    const { matches } = parseMatches(
      response([
        rawMatch({ startDate: null }),
        rawMatch({ secondContestant: null }),
        { __typename: 'GroupedMultisportMatch' },
      ]),
      { number: 1, label: 'Semana 1' },
      'nfl',
      NOW,
    );
    expect(matches).toEqual([]);
  });

  it('reports the service error instead of an empty round', () => {
    const body = JSON.stringify({
      errors: [{ message: 'Fail to get Multisport Matches from Phase' }],
      data: { multisportMatchesByPhase: null },
    });
    expect(() =>
      parseMatches(body, { number: 1, label: 'Wild Card' }, 'nfl', NOW),
    ).toThrow('Wild Card: Fail to get Multisport Matches from Phase');
  });
});

describe('NBA on the same pages', () => {
  it('reads baskets as points and keeps the conferences', () => {
    const nba = JSON.parse(JSON.stringify(context));
    const data = nba.getStandingData.body.standings;
    data.championshipEdition = {
      name: 'NBA 2026/2027',
      slug: 'nba-2026-2027',
      championship: { slug: 'nba' },
    };
    data.multisportStandings[0].standing = [
      {
        __typename: 'GroupedRoundRobinStandingData',
        name: 'Conferência Leste',
        totalRounds: 65,
        ratings: [
          {
            order: 1,
            standingColumns: [
              { slug: 'jogos', value: 15 },
              { slug: 'vitorias', value: 12 },
              { slug: 'derrotas', value: 3 },
              { slug: 'aproveitamento', value: 80 },
              { slug: 'cestas-pro', value: 1711 },
              { slug: 'cestas-contra', value: 1669 },
            ],
            contestant: {
              contestantData: team(4683, 'Philadelphia 76ers', 'PHI'),
            },
          },
        ],
      },
    ];

    const parsed = parseStandingsPage(page(nba));

    expect(parsed.season).toBe('2026/27');
    expect(parsed.phases[0]!.rounds).toBe(65);
    expect(parsed.standings[0]).toMatchObject({
      group: 'Conferência Leste',
      wins: 12,
      losses: 3,
      scoredFor: 1711,
      scoredAgainst: 1669,
    });
  });
});

describe('canReuse', () => {
  const game = (startsAt: string, status: Match['status']) =>
    ({ startsAt, status }) as Match;

  it('keeps settled rounds and rounds far ahead, asks for the rest', () => {
    // NOW is 2026-11-16 12:00 in Brasília.
    expect(canReuse([game('2026-11-10T21:00:00-03:00', 'finished')], NOW)).toBe(
      true,
    );
    expect(
      canReuse([game('2026-11-30T21:00:00-03:00', 'scheduled')], NOW),
    ).toBe(true);
    // Yesterday, today and the next days: always asked again.
    expect(canReuse([game('2026-11-15T21:00:00-03:00', 'finished')], NOW)).toBe(
      false,
    );
    expect(
      canReuse([game('2026-11-20T21:00:00-03:00', 'scheduled')], NOW),
    ).toBe(false);
    // An old game ge never closed is asked again until it is.
    expect(
      canReuse([game('2026-11-01T21:00:00-03:00', 'scheduled')], NOW),
    ).toBe(false);
    expect(canReuse([], NOW)).toBe(false);
  });
});

describe('needsFullRefresh', () => {
  const league = (fullRefreshAt?: string) =>
    ({ fullRefreshAt }) as CompetitionData;

  it('asks every round once a day, whatever the hour of the run', () => {
    // NOW is 2026-11-16 12:00 in Brasília (15:00 UTC).
    expect(needsFullRefresh(league('2026-11-16T03:00:00.000Z'), NOW)).toBe(
      false,
    );
    expect(needsFullRefresh(league('2026-11-15T15:00:00.000Z'), NOW)).toBe(
      true,
    );
  });

  it('does a full pass without previous data or the field', () => {
    expect(needsFullRefresh(undefined, NOW)).toBe(true);
    expect(needsFullRefresh(league(undefined), NOW)).toBe(true);
    expect(needsFullRefresh(league('garbage'), NOW)).toBe(true);
  });
});
