import { getMatchesBetween, saveSnapshot } from '../data/database';
import { getDayBounds } from '../utils/date';
import { logSync } from '../utils/syncLog';
import { fetchSnapshot } from './snapshotService';

export const DEFAULT_MAX_AGE_MS = 6 * 60 * 60 * 1000;
export const MATCH_DAY_MAX_AGE_MS = 15 * 60 * 1000;

export function isStale(
  lastSyncAt: number,
  isMatchDay: boolean,
  now: number,
): boolean {
  const maxAge = isMatchDay ? MATCH_DAY_MAX_AGE_MS : DEFAULT_MAX_AGE_MS;
  return now - lastSyncAt >= maxAge;
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
  const todayMatches = await getMatchesBetween(start, end);
  const isMatchDay = todayMatches.length > 0;
  const stale = isStale(lastSyncAt, isMatchDay, now);
  logSync('freshness checked', {
    ageMinutes: Math.floor((now - lastSyncAt) / 60000),
    isMatchDay,
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
