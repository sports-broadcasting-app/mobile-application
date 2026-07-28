import * as SQLite from 'expo-sqlite';
import { Sport, StandingsTable } from '../types/match';

const DB_NAME = 'sports_data.db';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS standings (
        id TEXT PRIMARY KEY,
        sport TEXT NOT NULL,
        championship TEXT NOT NULL,
        payload TEXT NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);
  }
  return db;
}

function tableId(table: StandingsTable): string {
  return [
    table.sport,
    table.championship,
    table.type,
    table.group ?? 'default',
  ].join(':');
}

export async function seedStandingsIfEmpty(
  tables: StandingsTable[],
): Promise<void> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM standings',
  );

  if ((row?.total ?? 0) > 0) return;
  await replaceStandings(tables);
}

export async function replaceStandings(
  tables: StandingsTable[],
): Promise<void> {
  const database = await getDb();

  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM standings');

    for (const table of tables) {
      await database.runAsync(
        `INSERT OR REPLACE INTO standings
          (id, sport, championship, payload, updatedAt)
          VALUES (?, ?, ?, ?, ?)`,
        [
          tableId(table),
          table.sport,
          table.championship,
          JSON.stringify(table),
          Date.now(),
        ],
      );
    }
  });
}

export async function getStoredStandings(
  championship?: string,
  sport?: Sport,
): Promise<StandingsTable[]> {
  const database = await getDb();
  const clauses: string[] = [];
  const params: string[] = [];

  if (championship) {
    clauses.push('championship = ?');
    params.push(championship);
  }

  if (sport) {
    clauses.push('sport = ?');
    params.push(sport);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await database.getAllAsync<{ payload: string }>(
    `SELECT payload FROM standings ${where} ORDER BY championship ASC, id ASC`,
    params,
  );

  return rows.map((row) => JSON.parse(row.payload) as StandingsTable);
}
