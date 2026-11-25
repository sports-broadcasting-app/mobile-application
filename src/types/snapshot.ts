export type Sport =
  'volei' | 'futebol' | 'futebol-americano' | 'basquete' | 'automobilismo';

export type CompetitionSlug =
  'masculina' | 'feminina' | 'serie-a' | 'nfl' | 'nba' | 'f1';

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

/** What a motorsport session is, read from its ge name. */
export type SessionKind =
  'practice' | 'sprint-qualifying' | 'sprint' | 'qualifying' | 'race' | 'other';

/**
 * One session of a race weekend (Formula 1): no teams and no score, only
 * when it starts and where it is shown. Sessions of one Grand Prix share
 * `grandPrixId`.
 */
export interface RaceSession {
  /** ge's id of the session. */
  id: string;
  competition: CompetitionSlug;
  /** The weekend it belongs to, stable across runs ("gp-do-catar-2026"). */
  grandPrixId: string;
  /** "GP do Catar". */
  grandPrix: string;
  /** As ge names it: "1º treino livre", "Classificação Sprint", "Corrida". */
  name: string;
  kind: SessionKind;
  /** ISO 8601 with offset. Always compare as an instant, never as text. */
  startsAt: string;
  status: MatchStatus;
  channels: string[];
  /** "Circuito Internacional de Lusail". */
  circuit: string | null;
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
  /**
   * Collector bookkeeping, ignored by the app: when each paid-API date was
   * last asked ("2026-11-22" → ISO instant), so frequent live runs do not
   * spend the daily quota asking the same date again and again.
   */
  sourceChecks?: Record<string, string>;
  /**
   * Motorsport: the sessions of each race weekend. A competition with
   * sessions has no teams, matches or standings.
   */
  sessions?: RaceSession[];
}

export interface Snapshot {
  version: 2;
  generatedAt: string;
  /** Competitions with teams. Builds before 1.5 read only these. */
  competitions: CompetitionData[];
  /**
   * Competitions without teams (Formula 1), published apart: builds before
   * 1.5 reject the whole file when an entry of `competitions` has no teams,
   * and ignore this key.
   */
  series?: CompetitionData[];
}
