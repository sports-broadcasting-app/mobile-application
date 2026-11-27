import { asObject, objectsOf, parseJson } from '../../src/utils/json.ts';
import type { CompetitionData } from '../../src/types/snapshot';
import {
  addPeriodScores,
  type ExternalGame,
  type ScoreOptions,
  type ScoreProvider,
} from '../periodScores.ts';

/**
 * NFL live scores and quarter scores from Big Balls Sports Data, the licensed
 * source for what ge does not have (ge sends live NFL games with an empty
 * scoreboard and never splits by quarter). The free plan covers one sport
 * (American football on this account) with 1,000 requests a day: at most two
 * dates per run, only on days with live games or finished ones still without
 * quarters.
 */

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

const STATUS: Record<string, ExternalGame['status']> = {
  live: 'live',
  finished: 'finished',
};

/** Games from a `/v1/matches?league=nfl&date=` answer. Throws on an error. */
export function parseNflGames(json: string): ExternalGame[] {
  const body = asObject(parseJson(json));
  if (body.error) throw new Error(`Big Balls: ${JSON.stringify(body.error)}`);

  const games: ExternalGame[] = [];
  for (const raw of objectsOf(body.data)) {
    const start = Date.parse(toText(raw.kickoff_utc));
    if (Number.isNaN(start)) continue;
    const score = asObject(raw.score);
    const linescore = asObject(raw.linescore);
    const homeScore = toScore(score.home);
    const awayScore = toScore(score.away);
    games.push({
      start,
      // A game without a score is not usable yet, whatever its status.
      status:
        homeScore === null || awayScore === null
          ? 'scheduled'
          : (STATUS[toText(raw.status)] ?? 'scheduled'),
      home: { name: toText(asObject(raw.home).name), code: '' },
      away: { name: toText(asObject(raw.away).name), code: '' },
      homeScore,
      awayScore,
      homeLines: toLines(linescore.home),
      awayLines: toLines(linescore.away),
    });
  }
  return games;
}

export const nflScores: ScoreProvider = {
  label: 'NFL scores',
  url: (date) =>
    `https://api.bigballsdata.com/v1/matches?league=nfl&date=${date}&tz=UTC&limit=50`,
  parse: parseNflGames,
  // Sunday night games cross midnight UTC: two dates cover a game day.
  maxDatesPerRun: 2,
  fillsScores: true,
};

/** Live and final NFL scores with their quarters; see `addPeriodScores`. */
export const addNflScores = (
  competition: CompetitionData,
  previous: CompetitionData | undefined,
  options: ScoreOptions,
) => addPeriodScores(competition, previous, nflScores, options);
