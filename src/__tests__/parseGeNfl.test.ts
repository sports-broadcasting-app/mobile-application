import { parseMatches, parseStandingsPage } from '../../scripts/nfl/parseGe';

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
    const { teams, standings } = parseStandingsPage(page());
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
    expect(matches[0].channels).toEqual([]);
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
