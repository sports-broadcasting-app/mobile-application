import { getLastSyncAt, saveFavorite, getFavorites } from '../data/database';
import {
  fetchSnapshot,
  withBundledTransfers,
} from '../services/snapshotService';
import {
  DEFAULT_MAX_AGE_MS,
  isStale,
  MATCH_DAY_MAX_AGE_MS,
  shouldSync,
  syncSnapshot,
} from '../services/syncService';
import {
  buildSnapshot,
  footballCompetition,
  scheduledMatch,
} from '../test-fixtures';

jest.mock('expo-sqlite', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../test-sqlite').createExpoSqliteMock(),
);

const fetchMock = jest.fn();
global.fetch = fetchMock;

function respondWith(body: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValueOnce({
    ok,
    status,
    url: 'https://example.com/superliga.json',
    headers: new Headers({ 'content-type': 'application/json' }),
    text: async () => JSON.stringify(body),
  });
}

const SUPERLIGA_CODES: Record<string, string> = {
  masculina: 'SDC MCV BVC SEC MTC SES SVG PCU GOI ASM NRD VSJ',
  feminina: 'SRJ SVB DPC OVC GMT FFC ECP BRU SSV MEC BVC BRB',
};

describe('withBundledTransfers', () => {
  it('fills both competitions from the list shipped with the app', () => {
    const snapshot = buildSnapshot([]);
    for (const competition of snapshot.competitions) {
      delete competition.transfers;
      competition.teams = SUPERLIGA_CODES[competition.slug]
        .split(' ')
        .map((code) => ({ id: code, name: code, code, badgeUrl: null }));
    }
    const [men, women] = withBundledTransfers(snapshot).competitions;
    expect(men.transfers?.length).toBeGreaterThan(100);
    expect(women.transfers?.length).toBeGreaterThan(100);
  });

  it('keeps transfers that came with the snapshot', () => {
    const snapshot = buildSnapshot([]);
    const published = snapshot.competitions[0].transfers;
    expect(withBundledTransfers(snapshot).competitions[0].transfers).toBe(
      published,
    );
  });

  it('skips the list instead of failing the sync when codes do not match', () => {
    const snapshot = buildSnapshot([]);
    delete snapshot.competitions[0].transfers;
    expect(
      withBundledTransfers(snapshot).competitions[0].transfers,
    ).toBeUndefined();
  });
});

describe('fetchSnapshot', () => {
  it('returns a valid snapshot', async () => {
    respondWith(buildSnapshot([]));
    await expect(fetchSnapshot()).resolves.toMatchObject({ version: 2 });
  });

  it('rejects an HTTP error', async () => {
    respondWith({}, false, 503);
    await expect(fetchSnapshot()).rejects.toThrow('503');
  });

  it('rejects a body that is not JSON', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      url: 'https://example.com/superliga.json',
      headers: new Headers({ 'content-type': 'text/html' }),
      text: async () => '<html></html>',
    });
    await expect(fetchSnapshot()).rejects.toThrow();
  });

  it('logs the status of a failed download', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    respondWith({}, false, 404);
    await expect(fetchSnapshot()).rejects.toThrow('404');
    expect(log).toHaveBeenCalledWith(
      '[sync] download finished',
      expect.stringContaining('"status":404'),
    );
    log.mockRestore();
  });

  it('rejects an unknown format', async () => {
    respondWith({ ...buildSnapshot([]), version: 1 });
    await expect(fetchSnapshot()).rejects.toThrow('Dados inválidos');
  });

  it('ignores a competition this app version does not know', async () => {
    const snapshot = buildSnapshot([]);
    snapshot.competitions.push({
      ...footballCompetition,
      slug: 'nba' as never,
    });
    respondWith(snapshot);
    const { competitions } = await fetchSnapshot();
    expect(competitions.map((c) => c.slug)).toEqual(['masculina', 'feminina']);
  });

  it('rejects a file whose competitions are all unknown', async () => {
    const snapshot = buildSnapshot([]);
    snapshot.competitions = [{ ...footballCompetition, slug: 'nba' as never }];
    respondWith(snapshot);
    await expect(fetchSnapshot()).rejects.toThrow('Dados inválidos');
  });
});

describe('sync rules', () => {
  const now = 10 * DEFAULT_MAX_AGE_MS;

  it('keeps recent data on a day without matches', () => {
    expect(isStale(now - MATCH_DAY_MAX_AGE_MS, false, now)).toBe(false);
    expect(isStale(now - DEFAULT_MAX_AGE_MS, false, now)).toBe(true);
  });

  it('refreshes sooner on a match day', () => {
    expect(isStale(now - MATCH_DAY_MAX_AGE_MS, true, now)).toBe(true);
  });

  it('always syncs on the first run', async () => {
    await expect(shouldSync(null, now)).resolves.toBe(true);
  });

  it('uses the shorter age when today has a match', async () => {
    respondWith(buildSnapshot([scheduledMatch]));
    await syncSnapshot();
    const matchDay = Date.parse(scheduledMatch.startsAt);
    const age = MATCH_DAY_MAX_AGE_MS + 1;
    await expect(shouldSync(matchDay - age, matchDay)).resolves.toBe(true);
  });
});

describe('syncSnapshot', () => {
  it('stores the data and preserves the favorite', async () => {
    await saveFavorite('masculina', '1');
    respondWith(buildSnapshot([scheduledMatch]));

    const syncedAt = await syncSnapshot();

    expect(await getLastSyncAt()).toBe(syncedAt);
    expect(await getFavorites()).toMatchObject({ masculina: '1' });
  });

  it('keeps local data when offline', async () => {
    respondWith(buildSnapshot([scheduledMatch]));
    const syncedAt = await syncSnapshot();

    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(syncSnapshot()).rejects.toThrow('Network');
    expect(await getLastSyncAt()).toBe(syncedAt);
  });
});
