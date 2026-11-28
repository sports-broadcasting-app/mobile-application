import * as SQLite from 'expo-sqlite';
import { buildSnapshot, scheduledMatch } from '@/test/fixtures';

jest.mock('expo-sqlite', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@/test/sqlite').createExpoSqliteMock(),
);

/** The tables as the release with schema 2 left them on the device. */
async function seedSchemaTwo() {
  const db = await SQLite.openDatabaseAsync('superliga.db');
  await db.execAsync(`
    CREATE TABLE standings (
      competition TEXT NOT NULL,
      teamId TEXT NOT NULL,
      position INTEGER NOT NULL,
      payload TEXT NOT NULL,
      PRIMARY KEY (competition, teamId)
    );
    CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE favorites (
      competition TEXT PRIMARY KEY,
      teamId TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    INSERT INTO meta (key, value) VALUES ('schemaVersion', '2');
    INSERT INTO standings VALUES ('masculina', '1', 1, '{}');
    INSERT INTO favorites VALUES ('masculina', '1', 1);
  `);
}

describe('database upgrade', () => {
  it('rebuilds the data tables of an older schema and keeps favorites', async () => {
    await seedSchemaTwo();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const database = require('./database');

    expect(await database.getFavorites()).toEqual({ masculina: '1' });
    expect(await database.getStandings('masculina')).toEqual([]);

    await database.saveSnapshot(buildSnapshot([scheduledMatch]), {
      syncedAt: 1000,
      key: 'k1000',
      etag: null,
    });
    const standings = await database.getStandings('masculina');
    expect(standings.map((row: { teamId: string }) => row.teamId)).toEqual([
      '2',
      '1',
    ]);
  });
});
