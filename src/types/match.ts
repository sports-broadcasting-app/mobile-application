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

export type Sport = 'football' | 'volleyball';

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

export interface Match {
  id: string;
  sport: Sport;
  championship: Championship;
  homeTeam: Team;
  awayTeam: Team;
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
  score: MatchScore;
  broadcast: Broadcast[];
  scoreUrl: string;
}

export interface DailySchedule {
  date: string;
  crawledAt: string;
  matches: Match[];
}
