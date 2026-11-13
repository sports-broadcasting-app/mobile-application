export type Sport = 'volei' | 'futebol';

export type CompetitionSlug = 'masculina' | 'feminina' | 'serie-a';

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed';

export interface Team {
  id: string;
  name: string;
  code: string;
  badgeUrl: string | null;
}

export interface SetScore {
  home: number;
  away: number;
}

export interface Match {
  id: string;
  competition: CompetitionSlug;
  /** ISO 8601 with offset. Always compare as an instant, never as text. */
  startsAt: string;
  round: number | null;
  roundLabel: string;
  homeTeamId: string;
  awayTeamId: string;
  status: MatchStatus;
  /** Sets in volleyball, goals in football. Null until the match starts. */
  homeScore: number | null;
  awayScore: number | null;
  /** Volleyball only; empty in football. */
  setScores: SetScore[];
  channels: string[];
  venue: string | null;
  city: string | null;
}

export interface Standing {
  teamId: string;
  position: number;
  points: number;
  matches: number;
  wins: number;
  /** Always 0 in volleyball. */
  draws: number;
  losses: number;
  /** Sets in volleyball, goals in football. */
  scoredFor: number;
  scoredAgainst: number;
}

/** A club in a transfer. `teamId` is null for clubs outside the competition. */
export interface TransferClub {
  teamId: string | null;
  name: string;
}

export interface Transfer {
  id: string;
  athleteName: string;
  position: string | null;
  from: TransferClub;
  to: TransferClub;
  /** Calendar date `YYYY-MM-DD`, not an instant. */
  date: string | null;
  loan: boolean;
  /** The news article the transfer was taken from. */
  sourceUrl: string;
}

export interface CompetitionData {
  slug: CompetitionSlug;
  sport: Sport;
  name: string;
  /** "2026/27" for the Superliga, "2026" for the Brasileirão. */
  season: string;
  teams: Team[];
  matches: Match[];
  standings: Standing[];
  /** Optional until the collector has a source for transfers. */
  transfers?: Transfer[];
}

export interface Snapshot {
  version: 2;
  generatedAt: string;
  competitions: CompetitionData[];
}
