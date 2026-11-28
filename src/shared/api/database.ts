import * as SQLite from 'expo-sqlite';
import {
  isMatch,
  isRaceSession,
  isStanding,
  isTeam,
  isTransfer,
} from '@/shared/lib/guards';
import { parseJson } from '@/shared/lib/json';
import {
  CompetitionSlug,
  Match,
  RaceSession,
  SessionKind,
  Standing,
  Snapshot,
  Team,
  Transfer,
} from './snapshot';

const DB_NAME = 'superliga.db';
const LAST_SYNC_KEY = 'lastSyncAt';
/** `fingerprint` of the snapshot the data tables hold. */
const SNAPSHOT_KEY = 'snapshotKey';
/** ETag of the file that snapshot came from, for a conditional download. */
const ETAG_KEY = 'etag';
const SYNC_KEYS = [LAST_SYNC_KEY, SNAPSHOT_KEY, ETAG_KEY] as const;
const SCHEMA_KEY = 'schemaVersion';
/** Bump when the stored payloads change shape; favorites are always kept. */
const SCHEMA_VERSION = '4';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Tables rebuilt from each snapshot; their columns follow SCHEMA_VERSION. */
const DATA_TABLES = `
  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    competition TEXT NOT NULL,
    payload TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    competition TEXT NOT NULL,
    startsAtMs INTEGER NOT NULL,
    payload TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_matches_startsAtMs ON matches (startsAtMs);
  CREATE TABLE IF NOT EXISTS standings (
    competition TEXT NOT NULL,
    teamId TEXT NOT NULL,
    position INTEGER NOT NULL,
    sortOrder INTEGER NOT NULL,
    payload TEXT NOT NULL,
    PRIMARY KEY (competition, teamId)
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    competition TEXT NOT NULL,
    grandPrixId TEXT NOT NULL,
    startsAtMs INTEGER NOT NULL,
    payload TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_startsAtMs ON sessions (startsAtMs);
  CREATE TABLE IF NOT EXISTS transfers (
    id TEXT NOT NULL,
    competition TEXT NOT NULL,
    date TEXT,
    payload TEXT NOT NULL,
    PRIMARY KEY (competition, id)
  );
`;

async function openDb(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS favorites (
      competition TEXT PRIMARY KEY,
      teamId TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);

  const schema = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    [SCHEMA_KEY],
  );
  if (schema?.value !== SCHEMA_VERSION) {
    // Tables written by an older app may lack columns: CREATE IF NOT EXISTS
    // would keep them as they are, so they are dropped and the next sync
    // fills them again. Favorites survive.
    await db.execAsync(`
      DROP TABLE IF EXISTS teams;
      DROP TABLE IF EXISTS matches;
      DROP TABLE IF EXISTS standings;
      DROP TABLE IF EXISTS transfers;
      DROP TABLE IF EXISTS sessions;
      DELETE FROM meta;
    `);
    await db.runAsync('INSERT INTO meta (key, value) VALUES (?, ?)', [
      SCHEMA_KEY,
      SCHEMA_VERSION,
    ]);
  }
  await db.execAsync(DATA_TABLES);
  return db;
}

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDb().catch((error: unknown) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

/**
 * Rows saved by `saveSnapshot`, read back through `is`: one that does not
 * pass (an older build's leftover) is skipped instead of breaking a screen.
 */
function parseRows<T>(
  rows: { payload: string }[],
  is: (value: unknown) => value is T,
): T[] {
  return rows.map((row) => parseJson(row.payload)).filter(is);
}

/** `?, ?, ?` for an `IN (…)` of these values. */
const placeholders = (values: readonly unknown[]) =>
  values.map(() => '?').join(', ');

/** The `payload` rows a query returns, each checked by `is`. */
async function queryRows<T>(
  sql: string,
  params: SQLite.SQLiteBindValue[],
  is: (value: unknown) => value is T,
): Promise<T[]> {
  const db = await getDb();
  return parseRows(await db.getAllAsync<{ payload: string }>(sql, params), is);
}

/**
 * Most `?` one statement may bind: 999 is the limit of older SQLite builds,
 * so it holds on any device. A multi-row INSERT of this size writes a whole
 * table in a few calls instead of one native call per row.
 */
const MAX_BOUND_PARAMS = 999;

/** Writes `rows` (one value per column each) in as few statements as fit. */
async function insertRows(
  db: SQLite.SQLiteDatabase,
  table: string,
  columns: readonly string[],
  rows: SQLite.SQLiteBindValue[][],
): Promise<void> {
  const tuple = `(${placeholders(columns)})`;
  const perStatement = Math.floor(MAX_BOUND_PARAMS / columns.length);
  for (let start = 0; start < rows.length; start += perStatement) {
    const chunk = rows.slice(start, start + perStatement);
    await db.runAsync(
      `INSERT OR REPLACE INTO ${table} (${columns.join(', ')})
        VALUES ${chunk.map(() => tuple).join(', ')}`,
      chunk.flat(),
    );
  }
}

/** What the last sync left: when, which data and the file's ETag. */
export interface SyncState {
  lastSyncAt: number | null;
  /** `fingerprint` of the saved snapshot; null before the first save. */
  snapshotKey: string | null;
  etag: string | null;
}

export async function getSyncState(): Promise<SyncState> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM meta WHERE key IN (${placeholders(SYNC_KEYS)})`,
    [...SYNC_KEYS],
  );
  const value = (key: string) =>
    rows.find((row) => row.key === key)?.value ?? null;
  const lastSyncAt = value(LAST_SYNC_KEY);
  return {
    lastSyncAt: lastSyncAt === null ? null : Number(lastSyncAt),
    snapshotKey: value(SNAPSHOT_KEY),
    etag: value(ETAG_KEY),
  };
}

export async function getLastSyncAt(): Promise<number | null> {
  return (await getSyncState()).lastSyncAt;
}

async function writeSyncMeta(
  db: SQLite.SQLiteDatabase,
  syncedAt: number,
  etag: string | null,
  snapshotKey?: string,
): Promise<void> {
  const entries: [string, string][] = [[LAST_SYNC_KEY, String(syncedAt)]];
  if (snapshotKey !== undefined) entries.push([SNAPSHOT_KEY, snapshotKey]);
  if (etag !== null) entries.push([ETAG_KEY, etag]);
  await insertRows(db, 'meta', ['key', 'value'], entries);
  if (etag === null)
    await db.runAsync('DELETE FROM meta WHERE key = ?', [ETAG_KEY]);
}

/**
 * The data did not change: only the time of the check (and the ETag) moves,
 * so the screens keep their rows and nothing is written again.
 */
export async function markSynced(
  syncedAt: number,
  etag: string | null,
): Promise<void> {
  const db = await getDb();
  await writeSyncMeta(db, syncedAt, etag);
}

/**
 * Replaces the competition data atomically, with the snapshot's `key` and
 * the file's ETag. Favorites are never touched.
 */
export async function saveSnapshot(
  snapshot: Snapshot,
  {
    syncedAt,
    key,
    etag,
  }: { syncedAt: number; key: string; etag: string | null },
): Promise<void> {
  const db = await getDb();
  const { competitions } = snapshot;

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM teams;
      DELETE FROM matches;
      DELETE FROM standings;
      DELETE FROM transfers;
      DELETE FROM sessions;
    `);

    await insertRows(
      db,
      'teams',
      ['id', 'competition', 'payload'],
      competitions.flatMap(({ slug, teams }) =>
        teams.map((team) => [team.id, slug, JSON.stringify(team)]),
      ),
    );
    await insertRows(
      db,
      'matches',
      ['id', 'competition', 'startsAtMs', 'payload'],
      competitions.flatMap(({ slug, matches }) =>
        matches.map((match) => [
          match.id,
          slug,
          Date.parse(match.startsAt),
          JSON.stringify(match),
        ]),
      ),
    );
    // The snapshot order is the display order: positions restart in each
    // group of a divided table, so sorting by them would interleave groups.
    await insertRows(
      db,
      'standings',
      ['competition', 'teamId', 'position', 'sortOrder', 'payload'],
      competitions.flatMap(({ slug, standings }) =>
        standings.map((standing, index) => [
          slug,
          standing.teamId,
          standing.position,
          index,
          JSON.stringify(standing),
        ]),
      ),
    );
    await insertRows(
      db,
      'sessions',
      ['id', 'competition', 'grandPrixId', 'startsAtMs', 'payload'],
      competitions.flatMap(({ slug, sessions }) =>
        (sessions ?? []).map((session) => [
          session.id,
          slug,
          session.grandPrixId,
          Date.parse(session.startsAt),
          JSON.stringify(session),
        ]),
      ),
    );
    await insertRows(
      db,
      'transfers',
      ['id', 'competition', 'date', 'payload'],
      competitions.flatMap(({ slug, transfers }) =>
        (transfers ?? []).map((transfer) => [
          transfer.id,
          slug,
          transfer.date,
          JSON.stringify(transfer),
        ]),
      ),
    );

    await writeSyncMeta(db, syncedAt, etag, key);
  });
}

export async function getMatchesBetween(
  fromMs: number,
  toMs: number,
): Promise<Match[]> {
  return queryRows(
    `SELECT payload FROM matches
      WHERE startsAtMs >= ? AND startsAtMs < ?
      ORDER BY startsAtMs ASC`,
    [fromMs, toMs],
    isMatch,
  );
}

/**
 * The next matches from `fromMs` on, soonest first. `competitions` limits
 * them to one competition or to a list (an empty list gives none).
 */
export async function getNextMatches(
  fromMs: number,
  limit: number,
  competitions?: CompetitionSlug | CompetitionSlug[],
): Promise<Match[]> {
  const list =
    competitions === undefined
      ? null
      : Array.isArray(competitions)
        ? competitions
        : [competitions];
  if (list && list.length === 0) return [];

  const inList = list ? `AND competition IN (${placeholders(list)})` : '';
  return queryRows(
    `SELECT payload FROM matches
      WHERE startsAtMs >= ? ${inList}
      ORDER BY startsAtMs ASC LIMIT ?`,
    [fromMs, ...(list ?? []), limit],
    isMatch,
  );
}

/**
 * Scheduled matches of the favorite teams from `fromMs` on, soonest first.
 * Each favorite is matched within its own competition, since team ids of
 * different sources are not guaranteed to be distinct.
 */
export async function getUpcomingFavoriteMatches(
  favorites: Favorites,
  fromMs: number,
  limit: number,
): Promise<Match[]> {
  const entries = Object.entries(favorites).filter(
    (entry): entry is [CompetitionSlug, string] => Boolean(entry[1]),
  );
  if (entries.length === 0) return [];

  const teamFilter = entries
    .map(
      () =>
        `(competition = ? AND (json_extract(payload, '$.homeTeamId') = ?
          OR json_extract(payload, '$.awayTeamId') = ?))`,
    )
    .join(' OR ');
  return queryRows(
    `SELECT payload FROM matches
      WHERE startsAtMs >= ?
        AND json_extract(payload, '$.status') = 'scheduled'
        AND (${teamFilter})
      ORDER BY startsAtMs ASC LIMIT ?`,
    [
      fromMs,
      ...entries.flatMap(([competition, teamId]) => [
        competition,
        teamId,
        teamId,
      ]),
      limit,
    ],
    isMatch,
  );
}

export async function getSessionsBetween(
  fromMs: number,
  toMs: number,
): Promise<RaceSession[]> {
  return queryRows(
    `SELECT payload FROM sessions
      WHERE startsAtMs >= ? AND startsAtMs < ?
      ORDER BY startsAtMs ASC`,
    [fromMs, toMs],
    isRaceSession,
  );
}

/** The next sessions from `fromMs` on of these competitions, soonest first. */
export async function getNextSessions(
  fromMs: number,
  limit: number,
  competitions: CompetitionSlug[],
): Promise<RaceSession[]> {
  if (competitions.length === 0) return [];
  return queryRows(
    `SELECT payload FROM sessions
      WHERE startsAtMs >= ? AND competition IN (${placeholders(competitions)})
      ORDER BY startsAtMs ASC LIMIT ?`,
    [fromMs, ...competitions, limit],
    isRaceSession,
  );
}

/** Every session of one race weekend, in order. */
export async function getGrandPrix(
  grandPrixId: string,
): Promise<RaceSession[]> {
  return queryRows(
    `SELECT payload FROM sessions WHERE grandPrixId = ?
      ORDER BY startsAtMs ASC`,
    [grandPrixId],
    isRaceSession,
  );
}

/**
 * Scheduled sessions of these kinds from `fromMs` on, soonest first: the
 * Formula 1 reminders, which go by session kind instead of a team.
 */
export async function getUpcomingSessions(
  competitions: CompetitionSlug[],
  kinds: SessionKind[],
  fromMs: number,
  limit: number,
): Promise<RaceSession[]> {
  if (competitions.length === 0 || kinds.length === 0) return [];
  return queryRows(
    `SELECT payload FROM sessions
      WHERE startsAtMs >= ?
        AND competition IN (${placeholders(competitions)})
        AND json_extract(payload, '$.status') = 'scheduled'
        AND json_extract(payload, '$.kind') IN (${placeholders(kinds)})
      ORDER BY startsAtMs ASC LIMIT ?`,
    [fromMs, ...competitions, ...kinds, limit],
    isRaceSession,
  );
}

/**
 * When the games and sessions of these competitions start between the two
 * instants: the week strip marks the days that have something.
 */
export async function getEventStarts(
  fromMs: number,
  toMs: number,
  competitions: CompetitionSlug[],
): Promise<number[]> {
  if (competitions.length === 0) return [];
  const db = await getDb();
  const list = placeholders(competitions);
  const rows = await db.getAllAsync<{ startsAtMs: number }>(
    `SELECT startsAtMs FROM matches
        WHERE startsAtMs >= ? AND startsAtMs < ? AND competition IN (${list})
      UNION ALL
      SELECT startsAtMs FROM sessions
        WHERE startsAtMs >= ? AND startsAtMs < ? AND competition IN (${list})`,
    [fromMs, toMs, ...competitions, fromMs, toMs, ...competitions],
  );
  return rows.map((row) => row.startsAtMs);
}

export async function getMatch(id: string): Promise<Match | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ payload: string }>(
    'SELECT payload FROM matches WHERE id = ?',
    [id],
  );
  const match = row ? parseJson(row.payload) : null;
  return isMatch(match) ? match : null;
}

export async function getTeams(competition?: CompetitionSlug): Promise<Team[]> {
  const teams = await queryRows(
    `SELECT payload FROM teams ${competition ? 'WHERE competition = ?' : ''}`,
    competition ? [competition] : [],
    isTeam,
  );
  return teams.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStandings(
  competition: CompetitionSlug,
): Promise<Standing[]> {
  return queryRows(
    'SELECT payload FROM standings WHERE competition = ? ORDER BY sortOrder ASC',
    [competition],
    isStanding,
  );
}

/** Newest first; transfers without a date go last. */
export async function getTransfers(
  competition: CompetitionSlug,
): Promise<Transfer[]> {
  return queryRows(
    `SELECT payload FROM transfers WHERE competition = ?
      ORDER BY date IS NULL, date DESC, id ASC`,
    [competition],
    isTransfer,
  );
}

export async function countTransfers(
  competition: CompetitionSlug,
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM transfers WHERE competition = ?',
    [competition],
  );
  return row?.total ?? 0;
}

export type Favorites = Partial<Record<CompetitionSlug, string>>;

export async function getFavorites(): Promise<Favorites> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    competition: CompetitionSlug;
    teamId: string;
  }>('SELECT competition, teamId FROM favorites');

  return Object.fromEntries(
    rows.map(({ competition, teamId }) => [competition, teamId]),
  );
}

export async function saveFavorite(
  competition: CompetitionSlug,
  teamId: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO favorites (competition, teamId, updatedAt)
      VALUES (?, ?, ?)`,
    [competition, teamId, Date.now()],
  );
}

export async function deleteFavorite(
  competition: CompetitionSlug,
): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM favorites WHERE competition = ?', [
    competition,
  ]);
}
