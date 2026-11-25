import {
  getMatchesBetween,
  getSessionsBetween,
  saveSnapshot,
} from '../data/database';
import type { Match } from '../types/snapshot';
import { getDayBounds } from '../utils/date';
import { logSync } from '../utils/syncLog';
import { fetchSnapshot } from './snapshotService';

export const DEFAULT_MAX_AGE_MS = 6 * 60 * 60 * 1000;
export const MATCH_DAY_MAX_AGE_MS = 15 * 60 * 1000;
/**
 * While a game is on, the collector publishes about every 10 minutes and the
 * file is cached for 5: checking every 5 keeps the score close to it.
 */
export const LIVE_MAX_AGE_MS = 5 * 60 * 1000;
/** Kickoff margin and the longest game (NFL, about 4 h) for "a game is on". */
const LIVE_BEFORE_MS = 15 * 60 * 1000;
const LIVE_AFTER_MS = 4 * 60 * 60 * 1000;

export function isStale(
  lastSyncAt: number,
  isMatchDay: boolean,
  now: number,
  hasLiveGame = false,
): boolean {
  const maxAge = hasLiveGame
    ? LIVE_MAX_AGE_MS
    : isMatchDay
      ? MATCH_DAY_MAX_AGE_MS
      : DEFAULT_MAX_AGE_MS;
  return now - lastSyncAt >= maxAge;
}

/** Whether a game (or race session) of today is live or around its start. */
export function isGameOn(
  match: Pick<Match, 'status' | 'startsAt'>,
  now: number,
): boolean {
  if (match.status === 'live') return true;
  if (match.status !== 'scheduled') return false;
  const start = Date.parse(match.startsAt);
  return now >= start - LIVE_BEFORE_MS && now <= start + LIVE_AFTER_MS;
}

export async function shouldSync(
  lastSyncAt: number | null,
  now: number,
): Promise<boolean> {
  if (lastSyncAt === null) {
    logSync('no local data, sync needed');
    return true;
  }
  const { start, end } = getDayBounds(new Date(now));
  const [todayMatches, todaySessions] = await Promise.all([
    getMatchesBetween(start, end),
    getSessionsBetween(start, end),
  ]);
  const today = [...todayMatches, ...todaySessions];
  const isMatchDay = today.length > 0;
  const hasLiveGame = today.some((m) => isGameOn(m, now));
  const stale = isStale(lastSyncAt, isMatchDay, now, hasLiveGame);
  logSync('freshness checked', {
    ageMinutes: Math.floor((now - lastSyncAt) / 60000),
    isMatchDay,
    hasLiveGame,
    stale,
  });
  return stale;
}

export async function syncSnapshot(): Promise<number> {
  const snapshot = await fetchSnapshot();
  const syncedAt = Date.now();
  await saveSnapshot(snapshot, syncedAt);
  logSync('snapshot saved', {
    generatedAt: snapshot.generatedAt,
    competitions: snapshot.competitions.map(({ slug, teams, matches }) => ({
      slug,
      teams: teams.length,
      matches: matches.length,
    })),
  });
  return syncedAt;
}
