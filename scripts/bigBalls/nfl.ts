import type {
  CompetitionData,
  Match,
  SetScore,
} from '../../src/types/snapshot';

/**
 * NFL live scores and quarter scores from Big Balls Sports Data, the licensed
 * source for what ge does not have (ge sends live NFL games with an empty
 * scoreboard and never splits by quarter). The free plan covers one sport
 * (American football on this account) with 1,000 requests a day: the
 * collector asks at most two dates per run, only on days with live games or
 * finished games still without quarters.
 */
const BASE_URL = 'https://api.bigballsdata.com/v1/matches';
/** Sunday night games cross midnight UTC: two dates cover a game day. */
const MAX_DATES_PER_RUN = 2;
/** Finished games older than this are no longer asked for. */
const LOOKBACK_MS = 36 * 60 * 60 * 1000;
/** ge and Big Balls kickoffs of the same game differ by minutes. */
const SAME_GAME_MS = 6 * 60 * 60 * 1000;

type Raw = Record<string, unknown>;

export interface NflGame {
  kickoff: number;
  status: string;
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  homeLines: number[];
  awayLines: number[];
}

const asObject = (value: unknown): Raw =>
  value && typeof value === 'object' ? (value as Raw) : {};

const toText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const toScore = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : null;

/** Quarter points; a null (period not played yet) ends the list. */
function toLines(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const lines: number[] = [];
  for (const item of value) {
    const n = toScore(item);
    if (n === null) break;
    lines.push(n);
  }
  return lines;
}

/** Games from a `/v1/matches?league=nfl&date=` answer. Throws on an error. */
export function parseNflGames(json: string): NflGame[] {
  const body = asObject(JSON.parse(json));
  if (body.error) throw new Error(`Big Balls: ${JSON.stringify(body.error)}`);
  if (!Array.isArray(body.data)) return [];

  const games: NflGame[] = [];
  for (const raw of body.data as Raw[]) {
    const kickoff = Date.parse(toText(raw.kickoff_utc));
    if (Number.isNaN(kickoff)) continue;
    const score = asObject(raw.score);
    const linescore = asObject(raw.linescore);
    games.push({
      kickoff,
      status: toText(raw.status),
      homeName: toText(asObject(raw.home).name),
      awayName: toText(asObject(raw.away).name),
      homeScore: toScore(score.home),
      awayScore: toScore(score.away),
      homeLines: toLines(linescore.home),
      awayLines: toLines(linescore.away),
    });
  }
  return games;
}

const sum = (lines: number[]) => lines.reduce((total, n) => total + n, 0);

export interface NflScore {
  homeScore: number;
  awayScore: number;
  periods: SetScore[];
  finished: boolean;
}

/**
 * The score and quarters of `match` from the games of its date: same two
 * teams (either order) and close kickoff, oriented to ge's home and away.
 * Null when the game is not found, has not started, or its quarters do not
 * add up to its score.
 */
export function findNflScore(
  match: Match,
  homeName: string,
  awayName: string,
  games: NflGame[],
): NflScore | null {
  const start = Date.parse(match.startsAt);
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  for (const game of games) {
    if (Math.abs(game.kickoff - start) > SAME_GAME_MS) continue;
    let flip: boolean;
    if (same(game.homeName, homeName) && same(game.awayName, awayName)) {
      flip = false;
    } else if (same(game.homeName, awayName) && same(game.awayName, homeName)) {
      flip = true;
    } else {
      continue;
    }
    const finished = game.status === 'finished';
    if (game.status !== 'live' && !finished) return null;
    if (game.homeScore === null || game.awayScore === null) return null;
    if (game.homeLines.length !== game.awayLines.length) return null;
    if (
      sum(game.homeLines) !== game.homeScore ||
      sum(game.awayLines) !== game.awayScore
    ) {
      return null;
    }
    const periods = game.homeLines.map((points, i) => ({
      home: points,
      away: game.awayLines[i],
    }));
    return flip
      ? {
          homeScore: game.awayScore,
          awayScore: game.homeScore,
          periods: periods.map(({ home, away }) => ({
            home: away,
            away: home,
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

const utcDate = (startsAt: string) =>
  new Date(Date.parse(startsAt)).toISOString().slice(0, 10);

/** Finished quarters must add up to the ge score and cover four quarters. */
function validFinished(periods: SetScore[], match: Match): boolean {
  return (
    periods.length >= 4 &&
    sum(periods.map((p) => p.home)) === match.homeScore &&
    sum(periods.map((p) => p.away)) === match.awayScore
  );
}

export interface NflScoreOptions {
  key: string | undefined;
  now: number;
  fetchText: (url: string, key: string) => Promise<string>;
}

/**
 * Fills live NFL scores (ge has none during the game) and quarter scores:
 * finished quarters kept from `previous` while valid, the rest asked for
 * (at most two UTC dates per run). Never throws. Mutates the matches.
 */
export async function addNflScores(
  competition: CompetitionData,
  previous: CompetitionData | undefined,
  { key, now, fetchText }: NflScoreOptions,
): Promise<string> {
  const kept = new Map(
    (previous?.matches ?? [])
      .filter((m) => m.status === 'finished' && m.periodScores)
      .map((m) => [m.id, m.periodScores as SetScore[]]),
  );
  let reused = 0;
  for (const match of competition.matches) {
    const periods = kept.get(match.id);
    if (
      periods &&
      match.status === 'finished' &&
      validFinished(periods, match)
    ) {
      match.periodScores = periods;
      reused++;
    }
  }

  const wanted = competition.matches.filter(
    (m) =>
      m.status === 'live' ||
      (m.status === 'finished' &&
        !m.periodScores &&
        now - Date.parse(m.startsAt) < LOOKBACK_MS),
  );
  if (!key) return `NFL scores: no API key, ${reused} kept`;
  if (wanted.length === 0) return `NFL scores: 0 dates asked, ${reused} kept`;

  const dates = [...new Set(wanted.map((m) => utcDate(m.startsAt)))]
    .sort()
    .reverse()
    .slice(0, MAX_DATES_PER_RUN);
  const teams = new Map(competition.teams.map((t) => [t.id, t.name]));
  let live = 0;
  let quarters = 0;
  for (const date of dates) {
    let games: NflGame[];
    try {
      games = parseNflGames(
        await fetchText(
          `${BASE_URL}?league=nfl&date=${date}&tz=UTC&limit=50`,
          key,
        ),
      );
    } catch (error) {
      console.log(`::warning::NFL scores for ${date} skipped: ${error}`);
      continue;
    }
    for (const match of wanted.filter((m) => utcDate(m.startsAt) === date)) {
      const home = teams.get(match.homeTeamId);
      const away = teams.get(match.awayTeamId);
      if (!home || !away) continue;
      const found = findNflScore(match, home, away, games);
      if (!found) continue;
      if (match.status === 'live') {
        // ge has no live NFL score; Big Balls fills it, quarter by quarter.
        match.homeScore = found.homeScore;
        match.awayScore = found.awayScore;
        match.periodScores = found.periods;
        live++;
      } else if (validFinished(found.periods, match)) {
        match.periodScores = found.periods;
        quarters++;
      }
    }
  }
  return `NFL scores: ${dates.length} date(s) asked, ${live} live, ${quarters} quarters added, ${reused} kept`;
}
