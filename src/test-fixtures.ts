import {
  CompetitionData,
  Match,
  Snapshot,
  Team,
  Transfer,
} from './types/snapshot';

export const homeTeam: Team = {
  id: '1',
  name: 'SADA CRUZEIRO',
  code: 'SAD',
  badgeUrl: null,
};

export const awayTeam: Team = {
  id: '2',
  name: 'VOLEI RENATA',
  code: 'REN',
  badgeUrl: null,
};

export const womenTeam: Team = {
  id: '3',
  name: 'GERDAU MINAS',
  code: 'GMT',
  badgeUrl: null,
};

export const scheduledMatch: Match = {
  id: '100',
  competition: 'masculina',
  startsAt: '2026-11-02T00:30:00+01:00',
  round: 3,
  roundLabel: 'TURNO - RODADA 3',
  homeTeamId: '1',
  awayTeamId: '2',
  status: 'scheduled',
  homeScore: null,
  awayScore: null,
  setScores: [],
  channels: ['GE TV'],
  venue: null,
  city: null,
};

export const finishedMatch: Match = {
  ...scheduledMatch,
  id: '101',
  status: 'finished',
  homeScore: 3,
  awayScore: 1,
  setScores: [
    { home: 25, away: 20 },
    { home: 22, away: 25 },
    { home: 25, away: 18 },
    { home: 25, away: 23 },
  ],
  channels: ['SporTV 2'],
  venue: 'ARENA MINAS',
  city: 'BELO HORIZONTE',
};

export const flamengo: Team = {
  id: '262',
  name: 'Flamengo',
  code: 'FLA',
  badgeUrl: 'https://s.sde.globo.com/flamengo.svg',
};

export const palmeiras: Team = {
  id: '275',
  name: 'Palmeiras',
  code: 'PAL',
  badgeUrl: null,
};

export const footballMatch: Match = {
  id: '346365',
  competition: 'serie-a',
  startsAt: '2026-11-14T18:30:00-03:00',
  round: 35,
  roundLabel: '35ª rodada',
  homeTeamId: '262',
  awayTeamId: '275',
  status: 'finished',
  homeScore: 2,
  awayScore: 1,
  setScores: [],
  channels: ['Premiere'],
  venue: 'Maracanã',
  city: null,
};

export const footballCompetition: CompetitionData = {
  slug: 'serie-a',
  sport: 'futebol',
  name: 'Brasileirão Série A',
  season: '2026',
  teams: [flamengo, palmeiras],
  matches: [footballMatch],
  standings: [
    {
      teamId: '262',
      position: 1,
      points: 76,
      matches: 34,
      wins: 23,
      draws: 7,
      losses: 4,
      scoredFor: 71,
      scoredAgainst: 29,
    },
    {
      teamId: '275',
      position: 2,
      points: 73,
      matches: 34,
      wins: 21,
      draws: 10,
      losses: 3,
      scoredFor: 62,
      scoredAgainst: 23,
    },
  ],
};

export const transfers: Transfer[] = [
  {
    id: 't1',
    athleteName: 'Ana Souza',
    position: 'Ponteira',
    from: { teamId: '2', name: 'VOLEI RENATA' },
    to: { teamId: '1', name: 'SADA CRUZEIRO' },
    date: '2026-10-28',
    loan: false,
    sourceUrl: 'https://www.lance.com.br/volei/ana-souza.html',
  },
  {
    id: 't2',
    athleteName: 'Bruno Lima',
    position: 'Levantador',
    from: { teamId: null, name: 'Modena (ITA)' },
    to: { teamId: '2', name: 'VOLEI RENATA' },
    date: '2026-09-15',
    loan: true,
    sourceUrl: 'https://ge.globo.com/volei/bruno-lima.ghtml',
  },
  {
    id: 't3',
    athleteName: 'Caio Dias',
    position: null,
    from: { teamId: '1', name: 'SADA CRUZEIRO' },
    to: { teamId: null, name: 'Clube Livre' },
    date: null,
    loan: false,
    sourceUrl: 'https://noataque.com.br/volei/caio-dias',
  },
];

/** Both Superligas; the men's one holds `matches`. */
export function buildSnapshot(matches: Match[]): Snapshot {
  return {
    version: 2,
    generatedAt: '2026-11-01T12:00:00.000Z',
    competitions: [
      {
        slug: 'masculina',
        sport: 'volei',
        name: 'Superliga Masculina',
        season: '2026/27',
        teams: [homeTeam, awayTeam],
        matches,
        transfers,
        standings: [
          {
            teamId: '2',
            position: 1,
            points: 9,
            matches: 3,
            wins: 3,
            draws: 0,
            losses: 0,
            scoredFor: 9,
            scoredAgainst: 1,
          },
          {
            teamId: '1',
            position: 2,
            points: 6,
            matches: 3,
            wins: 2,
            draws: 0,
            losses: 1,
            scoredFor: 7,
            scoredAgainst: 4,
          },
        ],
      },
      {
        slug: 'feminina',
        sport: 'volei',
        name: 'Superliga Feminina',
        season: '2026/27',
        teams: [womenTeam],
        matches: [],
        standings: [],
      },
    ],
  };
}
