import * as SQLite from 'expo-sqlite';
import {
  CompetitionSlug,
  Match,
  Standing,
  SuperligaSnapshot,
  Team,
} from '../types/superliga';

const DB_NAME = 'superliga.db';
const LAST_SYNC_KEY = 'lastSyncAt';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDb(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
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
      payload TEXT NOT NULL,
      PRIMARY KEY (competition, teamId)
    );
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

function parseRows<T>(rows: { payload: string }[]): T[] {
  return rows.map((row) => JSON.parse(row.payload) as T);
}

/** Replaces the competition data atomically. Favorites are never touched. */
export async function saveSnapshot(
  snapshot: SuperligaSnapshot,
  syncedAt: number,
): Promise<void> {
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM teams');
    await db.runAsync('DELETE FROM matches');
    await db.runAsync('DELETE FROM standings');

    for (const competition of snapshot.competitions) {
      for (const team of competition.teams) {
        await db.runAsync(
          'INSERT OR REPLACE INTO teams (id, competition, payload) VALUES (?, ?, ?)',
          [team.id, competition.slug, JSON.stringify(team)],
        );
      }

      for (const match of competition.matches) {
        await db.runAsync(
          `INSERT OR REPLACE INTO matches (id, competition, startsAtMs, payload)
            VALUES (?, ?, ?, ?)`,
          [
            match.id,
            competition.slug,
            Date.parse(match.startsAt),
            JSON.stringify(match),
          ],
        );
      }

      for (const standing of competition.standings) {
        await db.runAsync(
          `INSERT OR REPLACE INTO standings (competition, teamId, position, payload)
            VALUES (?, ?, ?, ?)`,
          [
            competition.slug,
            standing.teamId,
            standing.position,
            JSON.stringify(standing),
          ],
        );
      }
    }

    await db.runAsync(
      'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
      [LAST_SYNC_KEY, String(syncedAt)],
    );
  });
}

export async function getLastSyncAt(): Promise<number | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    [LAST_SYNC_KEY],
  );
  return row ? Number(row.value) : null;
}

export async function getMatchesBetween(
  fromMs: number,
  toMs: number,
): Promise<Match[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ payload: string }>(
    `SELECT payload FROM matches
      WHERE startsAtMs >= ? AND startsAtMs < ?
      ORDER BY startsAtMs ASC`,
    [fromMs, toMs],
  );
  return parseRows<Match>(rows);
}

export async function getNextMatches(
  fromMs: number,
  limit: number,
  competition?: CompetitionSlug,
): Promise<Match[]> {
  const db = await getDb();
  const rows = competition
    ? await db.getAllAsync<{ payload: string }>(
        `SELECT payload FROM matches
          WHERE startsAtMs >= ? AND competition = ?
          ORDER BY startsAtMs ASC LIMIT ?`,
        [fromMs, competition, limit],
      )
    : await db.getAllAsync<{ payload: string }>(
        `SELECT payload FROM matches
          WHERE startsAtMs >= ?
          ORDER BY startsAtMs ASC LIMIT ?`,
        [fromMs, limit],
      );
  return parseRows<Match>(rows);
}

export async function getMatch(id: string): Promise<Match | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ payload: string }>(
    'SELECT payload FROM matches WHERE id = ?',
    [id],
  );
  return row ? (JSON.parse(row.payload) as Match) : null;
}

export async function getTeams(competition?: CompetitionSlug): Promise<Team[]> {
  const db = await getDb();
  const rows = competition
    ? await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM teams WHERE competition = ?',
        [competition],
      )
    : await db.getAllAsync<{ payload: string }>('SELECT payload FROM teams');
  return parseRows<Team>(rows).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStandings(
  competition: CompetitionSlug,
): Promise<Standing[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ payload: string }>(
    'SELECT payload FROM standings WHERE competition = ? ORDER BY position ASC',
    [competition],
  );
  return parseRows<Standing>(rows);
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
