import {
  countTransfers,
  deleteFavorite,
  getFavorites,
  getLastSyncAt,
  getMatch,
  getMatchesBetween,
  getNextMatches,
  getStandings,
  getTeams,
  getTransfers,
  getSyncState,
  getUpcomingFavoriteMatches,
  markSynced,
  saveFavorite,
  saveSnapshot,
} from './database';
import {
  buildSnapshot,
  finishedMatch,
  homeTeam,
  scheduledMatch,
  transfers,
} from '@/test/fixtures';
import { getDayBounds } from '@/shared/lib/date';

jest.mock('expo-sqlite', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@/test/sqlite').createExpoSqliteMock(),
);

describe('database', () => {
  beforeEach(async () => {
    await deleteFavorite('masculina');
    await deleteFavorite('feminina');
    await saveSnapshot(buildSnapshot([scheduledMatch]), {
      syncedAt: 1000,
      key: 'k1000',
      etag: null,
    });
  });

  it('reads back the stored snapshot', async () => {
    expect(await getLastSyncAt()).toBe(1000);
    expect(await getMatch('100')).toEqual(scheduledMatch);
    expect(await getTeams('feminina')).toHaveLength(1);
    expect((await getTeams()).map((team) => team.id)).toEqual(['3', '1', '2']);
  });

  it('orders standings by position', async () => {
    const standings = await getStandings('masculina');
    expect(standings.map((row) => row.teamId)).toEqual(['2', '1']);
  });

  it('keeps a divided table in snapshot order, not by position', async () => {
    const snapshot = buildSnapshot([scheduledMatch]);
    const [first, second] = snapshot.competitions[0]!.standings;
    snapshot.competitions[0]!.standings = [
      { ...first!, position: 1, group: 'A' },
      { ...second!, position: 2, group: 'A' },
      { ...second!, teamId: '9', position: 1, group: 'B' },
    ];
    snapshot.competitions[0]!.teams.push({ ...homeTeam, id: '9' });
    await saveSnapshot(snapshot, { syncedAt: 3000, key: 'k3000', etag: null });
    const standings = await getStandings('masculina');
    expect(standings.map((row) => [row.group, row.position])).toEqual([
      ['A', 1],
      ['A', 2],
      ['B', 1],
    ]);
  });

  it('assigns a match to the local day, not to the day in its text', async () => {
    const { start, end } = getDayBounds(new Date(2026, 10, 1));
    const matches = await getMatchesBetween(start, end);
    expect(matches.map((match) => match.id)).toEqual(['100']);
  });

  it('finds the next matches of a competition', async () => {
    const from = new Date(2026, 9, 1).getTime();
    expect(await getNextMatches(from, 5, 'masculina')).toHaveLength(1);
    expect(await getNextMatches(from, 5, 'feminina')).toHaveLength(0);
    expect(
      await getNextMatches(from, 5, ['feminina', 'masculina']),
    ).toHaveLength(1);
    expect(await getNextMatches(from, 5, [])).toEqual([]);
  });

  it('removes matches that left the source', async () => {
    await saveSnapshot(buildSnapshot([finishedMatch]), {
      syncedAt: 2000,
      key: 'k2000',
      etag: null,
    });
    expect(await getMatch('100')).toBeNull();
    expect(await getLastSyncAt()).toBe(2000);
  });

  it('keeps favorites when the data is replaced', async () => {
    await saveFavorite('masculina', '1');
    await saveFavorite('feminina', '3');
    await saveSnapshot(buildSnapshot([finishedMatch]), {
      syncedAt: 2000,
      key: 'k2000',
      etag: null,
    });
    expect(await getFavorites()).toEqual({ masculina: '1', feminina: '3' });
  });

  it('lists transfers newest first, undated last', async () => {
    const stored = await getTransfers('masculina');
    expect(stored.map((transfer) => transfer.id)).toEqual(['t1', 't2', 't3']);
    expect(stored[1]).toEqual(transfers[1]);
    expect(await getTransfers('feminina')).toEqual([]);
    expect(await countTransfers('masculina')).toBe(3);
    expect(await countTransfers('feminina')).toBe(0);
  });

  it('accepts a snapshot without transfers', async () => {
    const snapshot = buildSnapshot([scheduledMatch]);
    delete snapshot.competitions[0]!.transfers;
    await saveSnapshot(snapshot, { syncedAt: 2000, key: 'k2000', etag: null });
    expect(await countTransfers('masculina')).toBe(0);
  });

  it('stores a single favorite per competition', async () => {
    await saveFavorite('masculina', '1');
    await saveFavorite('masculina', '2');
    expect(await getFavorites()).toEqual({ masculina: '2' });
  });

  it('finds the scheduled matches of the favorites, within their competition', async () => {
    const later = {
      ...scheduledMatch,
      id: '102',
      startsAt: '2026-11-09T00:30:00+01:00',
      homeTeamId: '2',
      awayTeamId: '1',
    };
    const others = {
      ...scheduledMatch,
      id: '103',
      homeTeamId: '7',
      awayTeamId: '8',
    };
    await saveSnapshot(
      buildSnapshot([later, scheduledMatch, finishedMatch, others]),
      { syncedAt: 2000, key: 'k2000', etag: null },
    );
    const from = new Date(2026, 9, 1).getTime();

    const found = await getUpcomingFavoriteMatches(
      { masculina: '1' },
      from,
      10,
    );
    expect(found.map((match) => match.id)).toEqual(['100', '102']);
    expect(
      await getUpcomingFavoriteMatches({ masculina: '1' }, from, 1),
    ).toHaveLength(1);
    // The same id in another competition is another team.
    expect(
      await getUpcomingFavoriteMatches({ feminina: '1' }, from, 10),
    ).toEqual([]);
    expect(await getUpcomingFavoriteMatches({}, from, 10)).toEqual([]);
    expect(
      await getUpcomingFavoriteMatches(
        { masculina: '1' },
        Date.parse(later.startsAt),
        10,
      ),
    ).toEqual([later]);
  });

  it('keeps the previous data if saving fails midway', async () => {
    const broken = buildSnapshot([{ ...finishedMatch, startsAt: 'invalid' }]);
    await expect(
      saveSnapshot(broken, { syncedAt: 2000, key: 'k2000', etag: null }),
    ).rejects.toThrow();
    expect(await getMatch('100')).toEqual(scheduledMatch);
    expect(await getLastSyncAt()).toBe(1000);
  });

  it('saves more rows than one statement can bind', async () => {
    // 600 matches × 4 columns is well over the 999 bound values of a statement.
    const many = Array.from({ length: 600 }, (_, index) => ({
      ...scheduledMatch,
      id: `m${index}`,
      startsAt: new Date(Date.UTC(2026, 9, 1, 0, index)).toISOString(),
    }));
    await saveSnapshot(buildSnapshot(many), {
      syncedAt: 5000,
      key: 'many',
      etag: 'rev W/"x"',
    });
    const saved = await getMatchesBetween(0, Number.MAX_SAFE_INTEGER);
    expect(saved).toHaveLength(600);
    expect(saved[0]!.id).toBe('m0');
    expect(saved[599]!.id).toBe('m599');
    expect(await getSyncState()).toEqual({
      lastSyncAt: 5000,
      snapshotKey: 'many',
      etag: 'rev W/"x"',
    });
  });

  it('moves only the check time when the data did not change', async () => {
    await saveSnapshot(buildSnapshot([scheduledMatch]), {
      syncedAt: 1000,
      key: 'same',
      etag: 'rev W/"a"',
    });
    await markSynced(9000, 'rev W/"b"');
    expect(await getSyncState()).toEqual({
      lastSyncAt: 9000,
      snapshotKey: 'same',
      etag: 'rev W/"b"',
    });
    expect(await getMatch(scheduledMatch.id)).toMatchObject({
      id: scheduledMatch.id,
    });
    await markSynced(9500, null);
    expect((await getSyncState()).etag).toBeNull();
  });
});
