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
  getUpcomingFavoriteMatches,
  saveFavorite,
  saveSnapshot,
} from '../data/database';
import {
  buildSnapshot,
  finishedMatch,
  scheduledMatch,
  transfers,
} from '../test-fixtures';
import { getDayBounds } from '../utils/date';

jest.mock('expo-sqlite', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../test-sqlite').createExpoSqliteMock(),
);

describe('database', () => {
  beforeEach(async () => {
    await deleteFavorite('masculina');
    await deleteFavorite('feminina');
    await saveSnapshot(buildSnapshot([scheduledMatch]), 1000);
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

  it('assigns a match to the local day, not to the day in its text', async () => {
    const { start, end } = getDayBounds(new Date(2026, 10, 1));
    const matches = await getMatchesBetween(start, end);
    expect(matches.map((match) => match.id)).toEqual(['100']);
  });

  it('finds the next matches of a competition', async () => {
    const from = new Date(2026, 9, 1).getTime();
    expect(await getNextMatches(from, 5, 'masculina')).toHaveLength(1);
    expect(await getNextMatches(from, 5, 'feminina')).toHaveLength(0);
  });

  it('removes matches that left the source', async () => {
    await saveSnapshot(buildSnapshot([finishedMatch]), 2000);
    expect(await getMatch('100')).toBeNull();
    expect(await getLastSyncAt()).toBe(2000);
  });

  it('keeps favorites when the data is replaced', async () => {
    await saveFavorite('masculina', '1');
    await saveFavorite('feminina', '3');
    await saveSnapshot(buildSnapshot([finishedMatch]), 2000);
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
    delete snapshot.competitions[0].transfers;
    await saveSnapshot(snapshot, 2000);
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
      2000,
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
    await expect(saveSnapshot(broken, 2000)).rejects.toThrow();
    expect(await getMatch('100')).toEqual(scheduledMatch);
    expect(await getLastSyncAt()).toBe(1000);
  });
});
