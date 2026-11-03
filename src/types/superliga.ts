export type CompetitionSlug = 'masculina' | 'feminina';

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
  homeSets: number | null;
  awaySets: number | null;
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
  losses: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
}

/** A club in a transfer. `teamId` is null for clubs outside the Superliga. */
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
  name: string;
  teams: Team[];
  matches: Match[];
  standings: Standing[];
  /** Optional until the collector has a source for transfers. */
  transfers?: Transfer[];
}

export interface SuperligaSnapshot {
  version: 1;
  generatedAt: string;
  season: string;
  competitions: CompetitionData[];
}
