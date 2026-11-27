import { pairLines, sum } from '../lines.ts';
import { asObject, objectsOf, parseJson } from '../../src/utils/json.ts';
import type {
  CompetitionData,
  Match,
  SetScore,
} from '../../src/types/snapshot';

/**
 * NBA quarter scores from API-Sports (API-NBA v2), the licensed source for
 * what ge does not have. The free plan gives 100 requests a day: the collector
 * runs every 30 minutes, so it asks at most one date per run, only for games
 * ge already marks finished, and keeps what it got in the published file.
 */
const BASE_URL = 'https://v2.nba.api-sports.io';
/** One request per run: even asking every run stays under 100 a day. */
const MAX_DATES_PER_RUN = 1;
/**
 * Live runs come every ~10 minutes on game nights: a date whose quarters are
 * not out yet is asked again only after this, so the free 100 a day hold.
 */
const ASK_AGAIN_AFTER_MS = 30 * 60 * 1000;
/** Games older than this are no longer asked for (bounds wasted requests). */
const LOOKBACK_MS = 36 * 60 * 60 * 1000;
/** ge and API-Sports start times of the same game differ by minutes. */
const SAME_GAME_MS = 6 * 60 * 60 * 1000;

/** The part of an API-Sports game the collector reads. */
export interface NbaGame {
  start: number;
  finished: boolean;
  homeName: string;
  homeCode: string;
  awayName: string;
  awayCode: string;
  homeLines: number[];
  awayLines: number[];
}

const toText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

function toLines(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const lines = value.map((line) => Number(line));
  return lines.every((n) => Number.isInteger(n) && n >= 0) ? lines : null;
}

/**
 * Games from a `/games?date=` answer. Throws on an API error (bad key, quota,
 * plan) so the caller can log it and publish without quarters.
 */
export function parseNbaGames(json: string): NbaGame[] {
  const body = asObject(parseJson(json));
  const errors = body.errors;
  const hasErrors = Array.isArray(errors)
    ? errors.length > 0
    : Object.keys(asObject(errors)).length > 0;
  if (hasErrors) throw new Error(`API-NBA: ${JSON.stringify(errors)}`);
  if (!Array.isArray(body.response)) return [];

  const games: NbaGame[] = [];
  for (const raw of objectsOf(body.response)) {
    const teams = asObject(raw.teams);
    const home = asObject(teams.home);
    const away = asObject(teams.visitors);
    const scores = asObject(raw.scores);
    const homeLines = toLines(asObject(scores.home).linescore);
    const awayLines = toLines(asObject(scores.visitors).linescore);
    const start = Date.parse(toText(asObject(raw.date).start));
    if (Number.isNaN(start) || !homeLines || !awayLines) continue;
    games.push({
      start,
      finished: toText(asObject(raw.status).long) === 'Finished',
      homeName: toText(home.name),
      homeCode: toText(home.code),
      awayName: toText(away.name),
      awayCode: toText(away.code),
      homeLines,
      awayLines,
    });
  }
  return games;
}

/** Whether quarter scores add up to the final score of the match. */
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

interface TeamKey {
  name: string;
  code: string;
}

const sameTeam = (team: TeamKey, name: string, code: string) =>
  (team.code !== '' && team.code === code) ||
  team.name.toLowerCase() === name.toLowerCase();

/**
 * The quarters of `match` from the API games of its date: same two teams,
 * close start, finished, and adding up to the ge score. Oriented to ge's
 * home and away, whatever order the API uses.
 */
export function findPeriods(
  match: Match,
  home: TeamKey,
  away: TeamKey,
  games: NbaGame[],
): SetScore[] | null {
  const start = Date.parse(match.startsAt);
  for (const game of games) {
    if (!game.finished || Math.abs(game.start - start) > SAME_GAME_MS) continue;
    let homeLines: number[];
    let awayLines: number[];
    if (
      sameTeam(home, game.homeName, game.homeCode) &&
      sameTeam(away, game.awayName, game.awayCode)
    ) {
      [homeLines, awayLines] = [game.homeLines, game.awayLines];
    } else if (
      sameTeam(home, game.awayName, game.awayCode) &&
      sameTeam(away, game.homeName, game.homeCode)
    ) {
      [homeLines, awayLines] = [game.awayLines, game.homeLines];
    } else {
      continue;
    }
    const periods = pairLines(homeLines, awayLines);
    if (!periods) return null;
    return periodsMatchScore(periods, match.homeScore, match.awayScore)
      ? periods
      : null;
  }
  return null;
}

/** The UTC day API-NBA files a game under (`date=` is a UTC date). */
const utcDate = (startsAt: string) =>
  new Date(Date.parse(startsAt)).toISOString().slice(0, 10);

export interface QuarterOptions {
  key: string | undefined;
  now: number;
  /** Fetches a URL with the API key header and returns the body. */
  fetchText: (url: string, key: string) => Promise<string>;
}

/**
 * Adds quarter scores to the finished NBA matches of `competition`: kept
 * from `previous` when still valid, otherwise asked for (one date per run).
 * Never throws: a missing key, an API error or the quota just leaves the
 * matches without quarters. Mutates `competition.matches`.
 */
export async function addNbaQuarters(
  competition: CompetitionData,
  previous: CompetitionData | undefined,
  { key, now, fetchText }: QuarterOptions,
): Promise<string> {
  const kept = new Map(
    (previous?.matches ?? []).flatMap((m): [string, SetScore[]][] =>
      m.periodScores ? [[m.id, m.periodScores]] : [],
    ),
  );
  let reused = 0;
  for (const match of competition.matches) {
    const periods = kept.get(match.id);
    if (
      periods &&
      match.status === 'finished' &&
      periodsMatchScore(periods, match.homeScore, match.awayScore)
    ) {
      match.periodScores = periods;
      reused++;
    }
  }

  const missing = competition.matches.filter(
    (m) =>
      m.status === 'finished' &&
      !m.periodScores &&
      now - Date.parse(m.startsAt) < LOOKBACK_MS,
  );
  // Dates asked recently, carried over from the published file (pruned).
  const checks: Record<string, string> = {};
  for (const [date, at] of Object.entries(previous?.sourceChecks ?? {})) {
    if (now - Date.parse(at) < LOOKBACK_MS) checks[date] = at;
  }
  competition.sourceChecks = checks;

  if (!key) return `NBA quarters: no API key, ${reused} kept`;
  if (missing.length === 0)
    return `NBA quarters: 0 dates asked, ${reused} kept`;

  // Most recent date first: the game that just ended matters most.
  const dates = [...new Set(missing.map((m) => utcDate(m.startsAt)))]
    .filter(
      (date) =>
        !checks[date] || now - Date.parse(checks[date]) >= ASK_AGAIN_AFTER_MS,
    )
    .sort()
    .reverse()
    .slice(0, MAX_DATES_PER_RUN);
  const teams = new Map(competition.teams.map((t) => [t.id, t]));
  let added = 0;
  for (const date of dates) {
    let games: NbaGame[];
    checks[date] = new Date(now).toISOString();
    try {
      games = parseNbaGames(
        await fetchText(`${BASE_URL}/games?date=${date}`, key),
      );
    } catch (error) {
      console.log(`::warning::NBA quarters for ${date} skipped: ${error}`);
      continue;
    }
    for (const match of missing.filter((m) => utcDate(m.startsAt) === date)) {
      const home = teams.get(match.homeTeamId);
      const away = teams.get(match.awayTeamId);
      if (!home || !away) continue;
      const periods = findPeriods(match, home, away, games);
      if (periods) {
        match.periodScores = periods;
        added++;
      }
    }
  }
  return `NBA quarters: ${dates.length} date(s) asked, ${added} added, ${reused} kept`;
}
