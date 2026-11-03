import { Match, SuperligaSnapshot, Team, Transfer } from './types/superliga';

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
  homeSets: null,
  awaySets: null,
  setScores: [],
  channels: ['GE TV'],
  venue: null,
  city: null,
};

export const finishedMatch: Match = {
  ...scheduledMatch,
  id: '101',
  status: 'finished',
  homeSets: 3,
  awaySets: 1,
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

export function buildSnapshot(matches: Match[]): SuperligaSnapshot {
  return {
    version: 1,
    generatedAt: '2026-11-01T12:00:00.000Z',
    season: '2026/27',
    competitions: [
      {
        slug: 'masculina',
        name: 'Superliga Masculina',
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
            losses: 0,
            setsWon: 9,
            setsLost: 1,
            pointsWon: 250,
            pointsLost: 200,
          },
          {
            teamId: '1',
            position: 2,
            points: 6,
            matches: 3,
            wins: 2,
            losses: 1,
            setsWon: 7,
            setsLost: 4,
            pointsWon: 240,
            pointsLost: 220,
          },
        ],
      },
      {
        slug: 'feminina',
        name: 'Superliga Feminina',
        teams: [womenTeam],
        matches: [],
        standings: [],
      },
    ],
  };
}
