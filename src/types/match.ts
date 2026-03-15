export interface Broadcast {
  name: string;
  url: string;
}

export interface Team {
  id: number;
  name: string;
  acronym: string;
  slug: string;
  logoUrl?: string;
}

export interface Championship {
  id: number;
  slug: string;
  phase: string;
}

export type Sport = 'football' | 'volleyball' | 'formula1';

export interface FootballScore {
  type: 'football';
  goals: {
    home: number | null;
    away: number | null;
  };
  penalties: {
    home: number | null;
    away: number | null;
  };
}

export interface VolleyballSetScore {
  home: number;
  away: number;
}

export interface VolleyballScore {
  type: 'volleyball';
  sets: {
    home: number | null;
    away: number | null;
  };
  setScores: VolleyballSetScore[];
}

export type MatchScore = FootballScore | VolleyballScore;

export type MatchStatus = 'match-not-started' | 'match-ended' | 'match-live';

interface MatchBase {
  id: string;
  championship: Championship;
  isoDate: string;
  date: string;
  hour: string;
  stadium: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  status: MatchStatus;
  result: string | null;
  round: number | null;
  broadcast: Broadcast[];
  scoreUrl: string;
}

export interface TeamMatch extends MatchBase {
  sport: 'football' | 'volleyball';
  homeTeam: Team;
  awayTeam: Team;
  score: MatchScore;
}

export interface FormulaOneMatch extends MatchBase {
  sport: 'formula1';
  eventName: string;
  sessionType: string;
  sessionLabel: string;
}

export type Match = TeamMatch | FormulaOneMatch;

export interface DailySchedule {
  date: string;
  crawledAt: string;
  matches: Match[];
}

export interface StandingTeam {
  name: string;
  slug: string;
  logoUrl: string;
}

export interface StandingRow {
  position: number;
  team: StandingTeam;
  points: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  setsWon?: number;
  setsLost?: number;
  driver?: string;
  nationality?: string;
  constructorName?: string;
  wins?: number;
}

export interface StandingsTable {
  sport: Sport;
  championship: string;
  championshipName: string;
  type: 'league' | 'group' | 'driver';
  group?: string;
  rows: StandingRow[];
  crawledAt: string;
}

export interface StandingsResponse {
  total: number;
  tables: StandingsTable[];
}

export interface BracketTeam {
  name: string;
  slug: string;
  logoUrl: string;
}

export interface BracketMatch {
  date: string;
  homeTeam: BracketTeam;
  awayTeam: BracketTeam;
  homeScore: number | null;
  awayScore: number | null;
  status: 'scheduled' | 'live' | 'finished';
}

export interface BracketSeries {
  homeTeam: BracketTeam;
  awayTeam: BracketTeam;
  matches: BracketMatch[];
  aggregateHome: number | null;
  aggregateAway: number | null;
  winner: string | null;
}

export interface BracketRound {
  name: string;
  series: BracketSeries[];
}

export interface Bracket {
  sport: Sport;
  championship: string;
  championshipName: string;
  rounds: BracketRound[];
  crawledAt: string;
}

export interface BracketsResponse {
  total: number;
  brackets: Bracket[];
}
