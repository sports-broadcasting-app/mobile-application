import * as SQLite from 'expo-sqlite';

const DB_NAME = 'team_logos.db';
const REFRESH_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 1 week

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS team_logos (
        slug TEXT PRIMARY KEY,
        logoUrl TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }
  return db;
}

export async function getAllLogos(): Promise<Map<string, string>> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ slug: string; logoUrl: string }>(
    'SELECT slug, logoUrl FROM team_logos',
  );
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.slug, row.logoUrl);
  }
  return map;
}

export async function upsertAllLogos(
  logos: Record<string, string>,
): Promise<void> {
  const database = await getDb();
  const entries = Object.entries(logos);
  if (entries.length === 0) return;

  await database.withTransactionAsync(async () => {
    for (const [slug, logoUrl] of entries) {
      await database.runAsync(
        'INSERT OR REPLACE INTO team_logos (slug, logoUrl) VALUES (?, ?)',
        [slug, logoUrl],
      );
    }
    await database.runAsync(
      "INSERT OR REPLACE INTO metadata (key, value) VALUES ('lastFetch', ?)",
      [String(Date.now())],
    );
  });
}

export async function shouldRefreshLogos(): Promise<boolean> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM metadata WHERE key = 'lastFetch'",
  );
  if (!row) return true;
  return Date.now() - Number(row.value) > REFRESH_INTERVAL;
}
