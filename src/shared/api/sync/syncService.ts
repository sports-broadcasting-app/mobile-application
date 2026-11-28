import {
  getMatchesBetween,
  getSessionsBetween,
  getSyncState,
  markSynced,
  saveSnapshot,
} from '../database';
import type { Match } from '../snapshot';
import { getDayBounds } from '@/shared/lib/date';
import { fingerprint } from '@/shared/lib/hash';
import { logSync } from './syncLog';
import { fetchSnapshot, transformRevision } from './snapshotService';

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

/** When the data was checked, and which data the screens should show. */
export interface SyncResult {
  syncedAt: number;
  /** Changes only when the saved data does: the screens' query key. */
  dataVersion: string;
}

/** The ETag is stored with the build's `transformRevision`: `rev etag`. */
const tagEtag = (etag: string | null) =>
  etag === null ? null : `${transformRevision()} ${etag}`;

function usableEtag(stored: string | null): string | null {
  if (stored === null) return null;
  const space = stored.indexOf(' ');
  return stored.slice(0, space) === transformRevision()
    ? stored.slice(space + 1)
    : null;
}

/**
 * Downloads the file and saves it, unless it is the data already saved: a
 * 304 (same ETag) or the same fingerprint only moves the time of the check,
 * so nothing is written and the screens keep their rows.
 */
export async function syncSnapshot(): Promise<SyncResult> {
  const saved = await getSyncState();
  const fetched = await fetchSnapshot(
    saved.snapshotKey === null ? null : usableEtag(saved.etag),
  );
  const syncedAt = Date.now();

  if (fetched.kind === 'unchanged' && saved.snapshotKey !== null) {
    await markSynced(syncedAt, saved.etag);
    logSync('snapshot unchanged', { by: 'etag' });
    return { syncedAt, dataVersion: saved.snapshotKey };
  }
  if (fetched.kind === 'unchanged') {
    // Only asked with a saved snapshot; a 304 without one is a server error.
    throw new Error('Falha ao baixar os dados (304)');
  }

  const { snapshot } = fetched;
  const etag = tagEtag(fetched.etag);
  const key = fingerprint(JSON.stringify(snapshot));
  if (key === saved.snapshotKey) {
    await markSynced(syncedAt, etag);
    logSync('snapshot unchanged', { by: 'fingerprint' });
    return { syncedAt, dataVersion: key };
  }

  await saveSnapshot(snapshot, { syncedAt, key, etag });
  logSync('snapshot saved', {
    generatedAt: snapshot.generatedAt,
    competitions: snapshot.competitions.map(({ slug, teams, matches }) => ({
      slug,
      teams: teams.length,
      matches: matches.length,
    })),
  });
  return { syncedAt, dataVersion: key };
}
