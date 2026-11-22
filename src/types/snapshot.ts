export type Sport = 'volei' | 'futebol' | 'futebol-americano' | 'basquete';

export type CompetitionSlug =
  'masculina' | 'feminina' | 'serie-a' | 'nfl' | 'nba';

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

export type MatchEventType = 'goal' | 'own-goal' | 'red-card';

/**
 * A goal or a sending-off, from the ge live feed of a football match.
 * Football only; nothing else in the feed is kept.
 */
export interface MatchEvent {
  type: MatchEventType;
  /**
   * The side the event counts for. A goal counts for the side that scored,
   * so an own goal counts for the opponent of the player; a red card belongs
   * to the player's side.
   */
  side: 'home' | 'away';
  /** The player's popular name, as ge shows it ("Jorginho"). */
  player: string;
  /** ge's period code: "1T" and "2T", or extra time codes in knockouts. */
  period: string;
  /**
   * The minute of the period counted from 1, as football does: 00:30 is the
   * 1st minute and 26:29 the 27th. Stoppage time runs past 45 (49 in the
   * 2nd half is shown as 45+4).
   */
  minute: number;
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
  /**
   * NBA and NFL: points per quarter, then each overtime (NBA from
   * API-Sports after the game; NFL from Big Balls, also during the game,
   * one entry per quarter played so far). They add up to the score.
   */
  periodScores?: SetScore[];
  /**
   * Football: goals and red cards in order. Absent when not collected yet;
   * for a finished match it is only kept when its goals add up to the score.
   */
  events?: MatchEvent[];
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
  /** Sets in volleyball, goals in football, points in American football. */
  scoredFor: number;
  scoredAgainst: number;
  /**
   * The division the table is split into ("AFC Leste"); `position` then
   * counts within it. Absent when the competition has a single table.
   */
  group?: string;
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
  /**
   * When this competition was last collected. Older than `generatedAt` when
   * its source failed and the collector kept the published data.
   */
  updatedAt?: string;
  /**
   * When every round was last fetched. The ge multisport leagues reuse
   * settled rounds in between and ask for all of them again once a day.
   */
  fullRefreshAt?: string;
}

export interface Snapshot {
  version: 2;
  generatedAt: string;
  competitions: CompetitionData[];
}
