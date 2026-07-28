import {
  Bracket,
  DailySchedule,
  Match,
  Sport,
  StandingsTable,
  Team,
} from '../types/match';

interface LocalLeague {
  sport: Sport;
  championship: string;
  teams: Team[];
}

interface LocalTeamsResponse {
  leagues: LocalLeague[];
}

const CRAWLED_AT = 'local';

const teams = {
  flamengo: {
    id: 1,
    name: 'Flamengo',
    acronym: 'FLA',
    slug: 'flamengo',
  },
  palmeiras: {
    id: 2,
    name: 'Palmeiras',
    acronym: 'PAL',
    slug: 'palmeiras',
  },
  corinthians: {
    id: 3,
    name: 'Corinthians',
    acronym: 'COR',
    slug: 'corinthians',
  },
  saoPaulo: {
    id: 4,
    name: 'Sao Paulo',
    acronym: 'SAO',
    slug: 'sao-paulo',
  },
  liverpool: {
    id: 5,
    name: 'Liverpool',
    acronym: 'LFC',
    slug: 'liverpool',
  },
  chelsea: {
    id: 6,
    name: 'Chelsea',
    acronym: 'CHE',
    slug: 'chelsea',
  },
  cruzeiroVolei: {
    id: 7,
    name: 'Sada Cruzeiro',
    acronym: 'CRU',
    slug: 'cruzeiro-volei',
  },
  taubate: {
    id: 8,
    name: 'Taubate',
    acronym: 'TAU',
    slug: 'taubate',
  },
  osasco: {
    id: 9,
    name: 'Osasco',
    acronym: 'OSA',
    slug: 'osasco',
  },
  praiaClube: {
    id: 10,
    name: 'Praia Clube',
    acronym: 'PRA',
    slug: 'praia-clube',
  },
} satisfies Record<string, Team>;

function getLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isoFor(date: string, hour: string): string {
  return new Date(`${date}T${hour}:00`).toISOString();
}

function localMatchesForDate(date: string): Match[] {
  return [
    {
      id: `${date}-brasileiro-fla-pal`,
      sport: 'football',
      championship: { id: 1, slug: 'brasileiro', phase: 'Primeira Fase' },
      homeTeam: teams.flamengo,
      awayTeam: teams.palmeiras,
      isoDate: isoFor(date, '19:00'),
      date,
      hour: '19h00',
      stadium: 'Maracana',
      location: { city: 'Rio de Janeiro', state: 'RJ', country: 'Brasil' },
      status: 'match-not-started',
      result: null,
      round: 18,
      score: {
        type: 'football',
        goals: { home: null, away: null },
        penalties: { home: null, away: null },
      },
      broadcast: [
        { name: 'Globo', url: '' },
        { name: 'Premiere', url: '' },
      ],
      scoreUrl: '',
    },
    {
      id: `${date}-brasileiro-cor-sao`,
      sport: 'football',
      championship: { id: 1, slug: 'brasileiro', phase: 'Primeira Fase' },
      homeTeam: teams.corinthians,
      awayTeam: teams.saoPaulo,
      isoDate: isoFor(date, '21:30'),
      date,
      hour: '21h30',
      stadium: 'Neo Quimica Arena',
      location: { city: 'Sao Paulo', state: 'SP', country: 'Brasil' },
      status: 'match-not-started',
      result: null,
      round: 18,
      score: {
        type: 'football',
        goals: { home: null, away: null },
        penalties: { home: null, away: null },
      },
      broadcast: [{ name: 'SporTV', url: '' }],
      scoreUrl: '',
    },
    {
      id: `${date}-ingles-liv-che`,
      sport: 'football',
      championship: { id: 2, slug: 'ingles', phase: 'Primeira Fase' },
      homeTeam: teams.liverpool,
      awayTeam: teams.chelsea,
      isoDate: isoFor(date, '16:45'),
      date,
      hour: '16h45',
      stadium: 'Anfield',
      location: { city: 'Liverpool', state: '', country: 'Inglaterra' },
      status: 'match-not-started',
      result: null,
      round: 24,
      score: {
        type: 'football',
        goals: { home: null, away: null },
        penalties: { home: null, away: null },
      },
      broadcast: [
        { name: 'ESPN', url: '' },
        { name: 'Disney+', url: '' },
      ],
      scoreUrl: '',
    },
    {
      id: `${date}-superliga-cru-tau`,
      sport: 'volleyball',
      championship: { id: 3, slug: 'superliga', phase: 'Primeira Fase' },
      homeTeam: teams.cruzeiroVolei,
      awayTeam: teams.taubate,
      isoDate: isoFor(date, '20:00'),
      date,
      hour: '20h00',
      stadium: 'Ginasio do Riacho',
      location: { city: 'Contagem', state: 'MG', country: 'Brasil' },
      status: 'match-not-started',
      result: null,
      round: 9,
      score: {
        type: 'volleyball',
        sets: { home: null, away: null },
        setScores: [],
      },
      broadcast: [{ name: 'SporTV 2', url: '' }],
      scoreUrl: '',
    },
    {
      id: `${date}-superliga-fem-osa-pra`,
      sport: 'volleyball',
      championship: {
        id: 4,
        slug: 'superliga-feminina',
        phase: 'Primeira Fase',
      },
      homeTeam: teams.osasco,
      awayTeam: teams.praiaClube,
      isoDate: isoFor(date, '18:30'),
      date,
      hour: '18h30',
      stadium: 'Jose Liberatti',
      location: { city: 'Osasco', state: 'SP', country: 'Brasil' },
      status: 'match-not-started',
      result: null,
      round: 11,
      score: {
        type: 'volleyball',
        sets: { home: null, away: null },
        setScores: [],
      },
      broadcast: [{ name: 'Canal Volei Brasil', url: '' }],
      scoreUrl: '',
    },
    {
      id: `${date}-formula1-gp-local`,
      sport: 'formula1',
      championship: { id: 5, slug: 'formula1', phase: '' },
      eventName: 'Grande Premio Local',
      sessionType: 'race',
      sessionLabel: 'Corrida',
      isoDate: isoFor(date, '14:00'),
      date,
      hour: '14h00',
      stadium: 'Autodromo',
      location: { city: 'Sao Paulo', state: 'SP', country: 'Brasil' },
      status: 'match-not-started',
      result: null,
      round: null,
      broadcast: [
        { name: 'Band', url: '' },
        { name: 'F1 TV Pro', url: '' },
      ],
      scoreUrl: '',
    },
  ];
}

export function getLocalSchedule(
  date = getLocalDate(),
  sport?: Sport,
): DailySchedule {
  const matches = localMatchesForDate(date).filter((match) =>
    sport ? match.sport === sport : true,
  );

  return {
    date,
    crawledAt: CRAWLED_AT,
    matches,
  };
}

function uniqueTeams(matches: Match[]): Team[] {
  const bySlug = new Map<string, Team>();
  matches.forEach((match) => {
    if (match.sport === 'formula1') return;
    bySlug.set(match.homeTeam.slug, match.homeTeam);
    bySlug.set(match.awayTeam.slug, match.awayTeam);
  });
  return Array.from(bySlug.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function getLocalTeams(sport?: Sport): LocalTeamsResponse {
  const leaguesByKey = new Map<
    string,
    LocalLeague & { teamsBySlug: Map<string, Team> }
  >();

  localMatchesForDate(getLocalDate()).forEach((match) => {
    if (sport && match.sport !== sport) return;
    if (match.sport === 'formula1') return;

    const key = `${match.sport}:${match.championship.slug}`;
    const league = leaguesByKey.get(key) ?? {
      sport: match.sport,
      championship: match.championship.slug,
      teams: [],
      teamsBySlug: new Map<string, Team>(),
    };

    uniqueTeams([match]).forEach((team) =>
      league.teamsBySlug.set(team.slug, team),
    );
    league.teams = Array.from(league.teamsBySlug.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    leaguesByKey.set(key, league);
  });

  return {
    leagues: Array.from(leaguesByKey.values())
      .map((league) => ({
        sport: league.sport,
        championship: league.championship,
        teams: league.teams,
      }))
      .sort((a, b) => a.championship.localeCompare(b.championship)),
  };
}

export const localStandings: StandingsTable[] = [
  {
    sport: 'football',
    championship: 'brasileiro',
    championshipName: 'Brasileiro',
    type: 'league',
    rows: [
      {
        position: 1,
        team: { name: 'Flamengo', slug: 'flamengo', logoUrl: '' },
        points: 41,
        played: 18,
        won: 12,
        drawn: 5,
        lost: 1,
        goalsFor: 31,
        goalsAgainst: 12,
        goalDifference: 19,
      },
      {
        position: 2,
        team: { name: 'Palmeiras', slug: 'palmeiras', logoUrl: '' },
        points: 38,
        played: 18,
        won: 11,
        drawn: 5,
        lost: 2,
        goalsFor: 28,
        goalsAgainst: 14,
        goalDifference: 14,
      },
      {
        position: 3,
        team: { name: 'Corinthians', slug: 'corinthians', logoUrl: '' },
        points: 31,
        played: 18,
        won: 9,
        drawn: 4,
        lost: 5,
        goalsFor: 22,
        goalsAgainst: 19,
        goalDifference: 3,
      },
      {
        position: 4,
        team: { name: 'Sao Paulo', slug: 'sao-paulo', logoUrl: '' },
        points: 29,
        played: 18,
        won: 8,
        drawn: 5,
        lost: 5,
        goalsFor: 21,
        goalsAgainst: 18,
        goalDifference: 3,
      },
    ],
    crawledAt: CRAWLED_AT,
  },
  {
    sport: 'football',
    championship: 'ingles',
    championshipName: 'Ingles',
    type: 'league',
    rows: [
      {
        position: 1,
        team: { name: 'Liverpool', slug: 'liverpool', logoUrl: '' },
        points: 56,
        played: 24,
        won: 17,
        drawn: 5,
        lost: 2,
        goalsFor: 52,
        goalsAgainst: 23,
        goalDifference: 29,
      },
      {
        position: 2,
        team: { name: 'Chelsea', slug: 'chelsea', logoUrl: '' },
        points: 49,
        played: 24,
        won: 15,
        drawn: 4,
        lost: 5,
        goalsFor: 44,
        goalsAgainst: 26,
        goalDifference: 18,
      },
    ],
    crawledAt: CRAWLED_AT,
  },
  {
    sport: 'volleyball',
    championship: 'superliga',
    championshipName: 'Superliga Masculina',
    type: 'league',
    rows: [
      {
        position: 1,
        team: { name: 'Sada Cruzeiro', slug: 'cruzeiro-volei', logoUrl: '' },
        points: 28,
        played: 10,
        won: 9,
        lost: 1,
        setsWon: 28,
        setsLost: 8,
      },
      {
        position: 2,
        team: { name: 'Taubate', slug: 'taubate', logoUrl: '' },
        points: 22,
        played: 10,
        won: 7,
        lost: 3,
        setsWon: 23,
        setsLost: 15,
      },
    ],
    crawledAt: CRAWLED_AT,
  },
  {
    sport: 'formula1',
    championship: 'formula1',
    championshipName: 'Formula 1',
    type: 'driver',
    rows: [
      {
        position: 1,
        team: { name: 'McLaren', slug: 'mclaren', logoUrl: '' },
        points: 284,
        driver: 'Lando Norris',
        nationality: 'Reino Unido',
        constructorName: 'McLaren',
        wins: 5,
      },
      {
        position: 2,
        team: { name: 'Ferrari', slug: 'ferrari', logoUrl: '' },
        points: 251,
        driver: 'Charles Leclerc',
        nationality: 'Monaco',
        constructorName: 'Ferrari',
        wins: 3,
      },
    ],
    crawledAt: CRAWLED_AT,
  },
];

export const localBrackets: Bracket[] = [
  {
    sport: 'football',
    championship: 'copa-do-brasil',
    championshipName: 'Copa do Brasil',
    rounds: [
      {
        name: 'Semifinal',
        series: [
          {
            homeTeam: { name: 'Flamengo', slug: 'flamengo', logoUrl: '' },
            awayTeam: { name: 'Sao Paulo', slug: 'sao-paulo', logoUrl: '' },
            matches: [
              {
                date: getLocalDate(),
                homeTeam: { name: 'Flamengo', slug: 'flamengo', logoUrl: '' },
                awayTeam: { name: 'Sao Paulo', slug: 'sao-paulo', logoUrl: '' },
                homeScore: null,
                awayScore: null,
                status: 'scheduled',
              },
            ],
            aggregateHome: null,
            aggregateAway: null,
            winner: null,
          },
        ],
      },
    ],
    crawledAt: CRAWLED_AT,
  },
];

export function getLocalStandings(
  championship?: string,
  sport?: Sport,
): StandingsTable[] {
  return localStandings.filter((table) => {
    if (championship && table.championship !== championship) return false;
    if (sport && table.sport !== sport) return false;
    return true;
  });
}

export function getLocalBrackets(
  championship?: string,
  sport?: Sport,
): Bracket[] {
  return localBrackets.filter((bracket) => {
    if (championship && bracket.championship !== championship) return false;
    if (sport && bracket.sport !== sport) return false;
    return true;
  });
}

export function getLocalTeamLogos(): Record<string, string> {
  return Object.fromEntries(
    Object.values(teams).map((team) => [team.slug, '']),
  );
}
