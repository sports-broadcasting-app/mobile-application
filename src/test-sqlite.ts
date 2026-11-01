/* eslint-disable @typescript-eslint/no-require-imports */
type SqlParams = (string | number)[];

/** Implements the used expo-sqlite API on a real in-memory SQLite database. */
export function createExpoSqliteMock() {
  const { DatabaseSync } = require('node:sqlite');
  const database = new DatabaseSync(':memory:');

  const db = {
    execAsync: async (sql: string) => {
      database.exec(sql);
    },
    runAsync: async (sql: string, params: SqlParams = []) =>
      database.prepare(sql).run(...params),
    getFirstAsync: async (sql: string, params: SqlParams = []) =>
      database.prepare(sql).get(...params) ?? null,
    getAllAsync: async (sql: string, params: SqlParams = []) =>
      database.prepare(sql).all(...params),
    withTransactionAsync: async (task: () => Promise<void>) => {
      database.exec('BEGIN');
      try {
        await task();
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };

  return { openDatabaseAsync: async () => db };
}
