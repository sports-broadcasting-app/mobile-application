import { asObject, objectsOf, parseJson } from '../../src/utils/json.ts';
import type { CompetitionData } from '../../src/types/snapshot';
import {
  addPeriodScores,
  type ExternalGame,
  type ScoreOptions,
  type ScoreProvider,
} from '../periodScores.ts';

/**
 * NBA quarter scores from API-Sports (API-NBA v2), the licensed source for
 * what ge does not have. The free plan gives 100 requests a day: one date per
 * run at most, only for games ge already marks finished, a date asked again
 * only after 30 minutes, and what came is kept in the published file.
 */

const toText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

function toLines(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const lines = value.map((line) => Number(line));
  return lines.every((n) => Number.isInteger(n) && n >= 0) ? lines : null;
}

/**
 * Games from a `/games?date=` answer. Only "Finished" ones count: the
 * others read as scheduled, since partial quarters must never be kept.
 * Throws on an API error (bad key, quota, plan).
 */
export function parseNbaGames(json: string): ExternalGame[] {
  const body = asObject(parseJson(json));
  const errors = body.errors;
  const hasErrors = Array.isArray(errors)
    ? errors.length > 0
    : Object.keys(asObject(errors)).length > 0;
  if (hasErrors) throw new Error(`API-NBA: ${JSON.stringify(errors)}`);

  const games: ExternalGame[] = [];
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
      status:
        toText(asObject(raw.status).long) === 'Finished'
          ? 'finished'
          : 'scheduled',
      home: { name: toText(home.name), code: toText(home.code) },
      away: { name: toText(away.name), code: toText(away.code) },
      // API-NBA totals are not read: the quarters are checked against ge's.
      homeScore: null,
      awayScore: null,
      homeLines,
      awayLines,
    });
  }
  return games;
}

export const nbaQuarters: ScoreProvider = {
  label: 'NBA quarters',
  url: (date) => `https://v2.nba.api-sports.io/games?date=${date}`,
  parse: parseNbaGames,
  maxDatesPerRun: 1,
  fillsScores: false,
  askAgainAfterMs: 30 * 60 * 1000,
};

/** Quarter scores for the finished NBA matches; see `addPeriodScores`. */
export const addNbaQuarters = (
  competition: CompetitionData,
  previous: CompetitionData | undefined,
  options: ScoreOptions,
) => addPeriodScores(competition, previous, nbaQuarters, options);
