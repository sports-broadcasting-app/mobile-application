import * as database from '../database';
import {
  getLastSyncAt,
  saveFavorite,
  getFavorites,
  markSynced,
} from '../database';
import type { Snapshot } from '../snapshot';
import {
  fetchSnapshot,
  transformRevision,
  withBundledTransfers,
} from './snapshotService';
import {
  DEFAULT_MAX_AGE_MS,
  isGameOn,
  isStale,
  LIVE_MAX_AGE_MS,
  MATCH_DAY_MAX_AGE_MS,
  shouldSync,
  syncSnapshot,
} from './syncService';
import {
  buildSnapshot,
  footballCompetition,
  scheduledMatch,
} from '@/test/fixtures';

jest.mock('expo-sqlite', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@/test/sqlite').createExpoSqliteMock(),
);

const fetchMock = jest.fn();
global.fetch = fetchMock;

function respondWith(
  body: unknown,
  ok = true,
  status = 200,
  etag: string | null = null,
) {
  fetchMock.mockResolvedValueOnce({
    ok,
    status,
    url: 'https://example.com/superliga.json',
    headers: new Headers({
      'content-type': 'application/json',
      ...(etag ? { etag } : {}),
    }),
    text: async () => JSON.stringify(body),
  });
}

function respondNotModified() {
  fetchMock.mockResolvedValueOnce({
    ok: false,
    status: 304,
    url: 'https://example.com/superliga.json',
    headers: new Headers(),
    text: async () => '',
  });
}

/** The snapshot of a download that must have returned one. */
async function fetched(): Promise<Snapshot> {
  const result = await fetchSnapshot();
  if (result.kind !== 'snapshot') throw new Error('expected a snapshot');
  return result.snapshot;
}

/** The If-None-Match the last request sent, if any. */
const sentEtag = () =>
  (fetchMock.mock.lastCall?.[1] as { headers?: Record<string, string> })
    ?.headers?.['If-None-Match'];

const SUPERLIGA_CODES: Record<string, string> = {
  masculina: 'SDC MCV BVC SEC MTC SES SVG PCU GOI ASM NRD VSJ',
  feminina: 'SRJ SVB DPC OVC GMT FFC ECP BRU SSV MEC BVC BRB',
};

describe('withBundledTransfers', () => {
  it('fills both competitions from the list shipped with the app', () => {
    const snapshot = buildSnapshot([]);
    for (const competition of snapshot.competitions) {
      delete competition.transfers;
      competition.teams = SUPERLIGA_CODES[competition.slug]!.split(' ').map(
        (code) => ({ id: code, name: code, code, badgeUrl: null }),
      );
    }
    const [men, women] = withBundledTransfers(snapshot).competitions;
    expect(men!.transfers?.length).toBeGreaterThan(100);
    expect(women!.transfers?.length).toBeGreaterThan(100);
  });

  it('keeps transfers that came with the snapshot', () => {
    const snapshot = buildSnapshot([]);
    const published = snapshot.competitions[0]!.transfers;
    expect(withBundledTransfers(snapshot).competitions[0]!.transfers).toBe(
      published,
    );
  });

  it('skips the list instead of failing the sync when codes do not match', () => {
    const snapshot = buildSnapshot([]);
    delete snapshot.competitions[0]!.transfers;
    expect(
      withBundledTransfers(snapshot).competitions[0]!.transfers,
    ).toBeUndefined();
  });
});

describe('fetchSnapshot', () => {
  it('returns a valid snapshot', async () => {
    respondWith(buildSnapshot([]), true, 200, 'W/"abc"');
    await expect(fetchSnapshot()).resolves.toMatchObject({
      kind: 'snapshot',
      snapshot: { version: 2 },
      etag: 'W/"abc"',
    });
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
      slug: 'cricket' as never,
    });
    respondWith(snapshot);
    const { competitions } = await fetched();
    expect(competitions.map((c) => c.slug)).toEqual(['masculina', 'feminina']);
  });

  it('rejects a file whose competitions are all unknown', async () => {
    const snapshot = buildSnapshot([]);
    snapshot.competitions = [
      { ...footballCompetition, slug: 'cricket' as never },
    ];
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

    const { syncedAt } = await syncSnapshot();

    expect(await getLastSyncAt()).toBe(syncedAt);
    expect(await getFavorites()).toMatchObject({ masculina: '1' });
  });

  it('keeps local data when offline', async () => {
    respondWith(buildSnapshot([scheduledMatch]));
    const { syncedAt } = await syncSnapshot();

    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(syncSnapshot()).rejects.toThrow('Network');
    expect(await getLastSyncAt()).toBe(syncedAt);
  });
});

describe('syncSnapshot with data already saved', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('asks with the saved ETag and writes nothing on a 304', async () => {
    respondWith(buildSnapshot([scheduledMatch]), true, 200, 'W/"one"');
    const first = await syncSnapshot();
    const save = jest.spyOn(database, 'saveSnapshot');

    respondNotModified();
    const second = await syncSnapshot();

    expect(sentEtag()).toBe('W/"one"');
    expect(save).not.toHaveBeenCalled();
    expect(second.dataVersion).toBe(first.dataVersion);
    expect(await getLastSyncAt()).toBe(second.syncedAt);
    save.mockRestore();
  });

  it('writes nothing when a full download brings the same data', async () => {
    respondWith(buildSnapshot([scheduledMatch]));
    const first = await syncSnapshot();
    const save = jest.spyOn(database, 'saveSnapshot');

    respondWith(buildSnapshot([scheduledMatch]));
    const second = await syncSnapshot();

    expect(save).not.toHaveBeenCalled();
    expect(second.dataVersion).toBe(first.dataVersion);
    save.mockRestore();
  });

  it('saves and moves the data version when the data changed', async () => {
    respondWith(buildSnapshot([]));
    const first = await syncSnapshot();

    respondWith(buildSnapshot([scheduledMatch]), true, 200, 'W/"two"');
    const second = await syncSnapshot();

    expect(second.dataVersion).not.toBe(first.dataVersion);
    expect(
      await database.getMatchesBetween(0, Number.MAX_SAFE_INTEGER),
    ).toHaveLength(1);
  });

  it('does not trust an ETag saved by a build that shapes data differently', async () => {
    respondWith(buildSnapshot([scheduledMatch]), true, 200, 'W/"one"');
    await syncSnapshot();
    await markSynced(1, 'another-build W/"one"');

    respondWith(buildSnapshot([scheduledMatch]));
    await syncSnapshot();
    expect(sentEtag()).toBeUndefined();
    expect(transformRevision()).not.toBe('another-build');
  });
});

describe('live freshness', () => {
  const now = Date.parse('2026-11-22T20:00:00-03:00');

  it('uses 5 minutes while a game is on', () => {
    expect(isStale(now - LIVE_MAX_AGE_MS, true, now, true)).toBe(true);
    expect(isStale(now - LIVE_MAX_AGE_MS + 1, true, now, true)).toBe(false);
  });

  it('counts live games and games around kickoff, not finished ones', () => {
    const base = {
      id: '1',
      competition: 'nfl' as const,
      round: 1,
      roundLabel: '',
      homeTeamId: 'a',
      awayTeamId: 'b',
      homeScore: null,
      awayScore: null,
      setScores: [],
      channels: [],
      venue: null,
      city: null,
    };
    expect(
      isGameOn(
        { ...base, status: 'live', startsAt: '2026-11-22T15:00:00-03:00' },
        now,
      ),
    ).toBe(true);
    expect(
      isGameOn(
        { ...base, status: 'scheduled', startsAt: '2026-11-22T20:10:00-03:00' },
        now,
      ),
    ).toBe(true);
    expect(
      isGameOn(
        { ...base, status: 'scheduled', startsAt: '2026-11-22T22:00:00-03:00' },
        now,
      ),
    ).toBe(false);
    expect(
      isGameOn(
        { ...base, status: 'finished', startsAt: '2026-11-22T19:00:00-03:00' },
        now,
      ),
    ).toBe(false);
  });
});
