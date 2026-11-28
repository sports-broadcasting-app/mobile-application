import type {
  CompetitionData,
  Match,
  SetScore,
  Team,
} from '../src/shared/api/snapshot';
import { pairLines, sum } from './lines.ts';

/**
 * Scores by period (quarters, overtime) from a licensed API, for what ge
 * does not publish: the engine shared by API-Sports (NBA) and Big Balls
 * (NFL). Each one is a `ScoreProvider`; this file asks, matches and applies.
 */

/** Games older than this are no longer asked for (bounds wasted requests). */
const LOOKBACK_MS = 36 * 60 * 60 * 1000;
/** ge and the APIs give start times of the same game minutes apart. */
const SAME_GAME_MS = 6 * 60 * 60 * 1000;

export interface TeamKey {
  name: string;
  /** Empty when the API has no code: the name decides. */
  code: string;
}

/** A game as every provider parses it. */
export interface ExternalGame {
  start: number;
  /** `scheduled` also covers anything not usable yet. */
  status: 'scheduled' | 'live' | 'finished';
  home: TeamKey;
  away: TeamKey;
  /** Null when the API gives no total (API-NBA): the lines then stand alone. */
  homeScore: number | null;
  awayScore: number | null;
  homeLines: number[];
  awayLines: number[];
}

export interface ScoreProvider {
  /** "NBA quarters": the start of every log line. */
  label: string;
  url: (utcDate: string) => string;
  /** Throws on an API error (bad key, quota, plan). */
  parse: (body: string) => ExternalGame[];
  maxDatesPerRun: number;
  /**
   * Fills the score of live games and of finished ones ge has not scored
   * yet (Big Balls, NFL), besides the periods.
   */
  fillsScores: boolean;
  /**
   * Asks a date again only after this, remembered in `sourceChecks`: for a
   * small daily quota on nights of live runs every ~10 minutes (API-NBA).
   */
  askAgainAfterMs?: number;
}

export interface ScoreOptions {
  key: string | undefined;
  now: number;
  /** Fetches a URL with the API key header and returns the body. */
  fetchText: (url: string, key: string) => Promise<string>;
}

/** At least four periods adding up to the score of the match. */
export function periodsMatchScore(
  periods: SetScore[],
  homeScore: number | null,
  awayScore: number | null,
): boolean {
  return (
    periods.length >= 4 &&
    sum(periods.map((p) => p.home)) === homeScore &&
    sum(periods.map((p) => p.away)) === awayScore
  );
}

const sameTeam = (team: TeamKey, other: TeamKey) =>
  (team.code !== '' && team.code === other.code) ||
  team.name.toLowerCase() === other.name.toLowerCase();

export interface GameScore {
  homeScore: number | null;
  awayScore: number | null;
  periods: SetScore[];
  finished: boolean;
}

/**
 * The game of `match` among the API games of its date: the same two teams
 * (either order) and a close start, oriented to ge's home and away. Null
 * when it is not found, has not started, or its lines do not add up to the
 * API total.
 */
export function findGameScore(
  match: Match,
  home: TeamKey,
  away: TeamKey,
  games: ExternalGame[],
): GameScore | null {
  const start = Date.parse(match.startsAt);
  for (const game of games) {
    if (Math.abs(game.start - start) > SAME_GAME_MS) continue;
    const flip = sameTeam(home, game.away) && sameTeam(away, game.home);
    if (!flip && !(sameTeam(home, game.home) && sameTeam(away, game.away))) {
      continue;
    }
    if (game.status === 'scheduled') return null;
    const periods = pairLines(game.homeLines, game.awayLines);
    if (!periods) return null;
    if (
      game.homeScore !== null &&
      game.awayScore !== null &&
      (sum(game.homeLines) !== game.homeScore ||
        sum(game.awayLines) !== game.awayScore)
    ) {
      return null;
    }
    const finished = game.status === 'finished';
    return flip
      ? {
          homeScore: game.awayScore,
          awayScore: game.homeScore,
          periods: periods.map(({ home: h, away: a }) => ({
            home: a,
            away: h,
          })),
          finished,
        }
      : {
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          periods,
          finished,
        };
  }
  return null;
}

/** The UTC day the APIs file a game under (`date=` is a UTC date). */
const utcDate = (startsAt: string) =>
  new Date(Date.parse(startsAt)).toISOString().slice(0, 10);

/**
 * Adds periods (and, for `fillsScores`, live and missing final scores) to
 * the matches of `competition`: finished ones kept from `previous` while
 * they still add up, the rest asked for, a few UTC dates per run. Never
 * throws: no key, an API error or the quota leave the matches as they are.
 * Mutates the matches; returns a log line.
 */
export async function addPeriodScores(
  competition: CompetitionData,
  previous: CompetitionData | undefined,
  provider: ScoreProvider,
  { key, now, fetchText }: ScoreOptions,
): Promise<string> {
  const { label, fillsScores, askAgainAfterMs } = provider;
  const kept = new Map(
    (previous?.matches ?? [])
      .filter((m) => m.status === 'finished' && m.periodScores)
      .map((m) => [m.id, m]),
  );
  let reused = 0;
  for (const match of competition.matches) {
    const old = kept.get(match.id);
    if (!old?.periodScores || match.status !== 'finished') continue;
    if (match.homeScore === null || match.awayScore === null) {
      // ge has not published the final score yet: keep the one the API gave
      // last run, which its periods already add up to.
      if (
        fillsScores &&
        periodsMatchScore(old.periodScores, old.homeScore, old.awayScore)
      ) {
        match.homeScore = old.homeScore;
        match.awayScore = old.awayScore;
        match.periodScores = old.periodScores;
        reused++;
      }
    } else if (
      periodsMatchScore(old.periodScores, match.homeScore, match.awayScore)
    ) {
      match.periodScores = old.periodScores;
      reused++;
    }
  }

  const wanted = competition.matches.filter(
    (m) =>
      (fillsScores && m.status === 'live') ||
      (m.status === 'finished' &&
        !m.periodScores &&
        now - Date.parse(m.startsAt) < LOOKBACK_MS),
  );
  // Dates asked recently, carried over from the published file (pruned).
  const checks: Record<string, string> = {};
  if (askAgainAfterMs !== undefined) {
    for (const [date, at] of Object.entries(previous?.sourceChecks ?? {})) {
      if (now - Date.parse(at) < LOOKBACK_MS) checks[date] = at;
    }
    competition.sourceChecks = checks;
  }

  if (!key) return `${label}: no API key, ${reused} kept`;
  if (wanted.length === 0) return `${label}: 0 dates asked, ${reused} kept`;

  // Most recent date first: the game that just ended matters most.
  const dates = [...new Set(wanted.map((m) => utcDate(m.startsAt)))]
    .filter((date) => {
      const asked = checks[date];
      return (
        askAgainAfterMs === undefined ||
        !asked ||
        now - Date.parse(asked) >= askAgainAfterMs
      );
    })
    .sort()
    .reverse()
    .slice(0, provider.maxDatesPerRun);
  const teams = new Map<string, Team>(competition.teams.map((t) => [t.id, t]));
  let live = 0;
  let added = 0;
  for (const date of dates) {
    if (askAgainAfterMs !== undefined)
      checks[date] = new Date(now).toISOString();
    let games: ExternalGame[];
    try {
      games = provider.parse(await fetchText(provider.url(date), key));
    } catch (error) {
      console.log(`::warning::${label} for ${date} skipped: ${error}`);
      continue;
    }
    for (const match of wanted.filter((m) => utcDate(m.startsAt) === date)) {
      const home = teams.get(match.homeTeamId);
      const away = teams.get(match.awayTeamId);
      const found =
        home && away ? findGameScore(match, home, away, games) : null;
      if (!found) continue;
      if (match.status === 'live') {
        // ge has no live score here; the API fills it, period by period.
        if (found.homeScore !== null && found.awayScore !== null) {
          match.homeScore = found.homeScore;
          match.awayScore = found.awayScore;
          match.periodScores = found.periods;
          live++;
        }
      } else if (match.homeScore === null || match.awayScore === null) {
        // Marked finished by the clock before ge has the final score.
        if (
          fillsScores &&
          found.finished &&
          found.homeScore !== null &&
          found.awayScore !== null &&
          found.periods.length >= 4
        ) {
          match.homeScore = found.homeScore;
          match.awayScore = found.awayScore;
          match.periodScores = found.periods;
          added++;
        }
      } else if (
        periodsMatchScore(found.periods, match.homeScore, match.awayScore)
      ) {
        match.periodScores = found.periods;
        added++;
      }
    }
  }
  const counts = fillsScores
    ? `${live} live, ${added} quarters added`
    : `${added} added`;
  return `${label}: ${dates.length} date(s) asked, ${counts}, ${reused} kept`;
}
