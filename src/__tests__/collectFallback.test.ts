import { collectWithFallback, Source } from '../../scripts/fallback';
import { fetchText } from '../../scripts/http';
import type {
  CompetitionData,
  CompetitionSlug,
  Snapshot,
  Team,
} from '../types/snapshot';

/** Just enough of a competition to pass the collector's sanity checks. */
function competition(slug: CompetitionSlug, label: string): CompetitionData {
  const teams: Team[] = Array.from({ length: 8 }, (_, i) => ({
    id: `${slug}-${i}`,
    name: `Time ${i}`,
    code: `T${i}`,
    badgeUrl: null,
  }));
  return {
    slug,
    sport: 'futebol',
    name: label,
    season: '2026',
    teams,
    matches: teams.map((team, i) => ({
      id: `${slug}-m${i}`,
      competition: slug,
      startsAt: '2026-11-20T20:00:00-03:00',
      round: 1,
      roundLabel: '1ª rodada',
      status: 'scheduled' as const,
      homeTeamId: team.id,
      awayTeamId: teams[(i + 1) % teams.length].id,
      homeScore: null,
      awayScore: null,
      setScores: [],
      channels: [],
      venue: null,
      city: null,
    })),
    standings: teams.map((team, i) => ({
      teamId: team.id,
      position: i + 1,
      points: 0,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      scoredFor: 0,
      scoredAgainst: 0,
    })),
  };
}

const previous: Snapshot = {
  version: 2,
  generatedAt: '2026-11-18T10:00:00.000Z',
  competitions: [
    competition('masculina', 'Masculina antiga'),
    competition('feminina', 'Feminina antiga'),
    competition('nfl', 'NFL antiga'),
  ],
};
const now = new Date('2026-11-18T12:00:00.000Z');

const ok = (slug: CompetitionSlug): Source => ({
  name: slug,
  slugs: [slug],
  collect: async () => [competition(slug, `${slug} nova`)],
});
const broken = (name: string, slugs: CompetitionSlug[]): Source => ({
  name,
  slugs,
  collect: async () => {
    throw new Error('ge returned 503');
  },
});

describe('collectWithFallback', () => {
  beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('keeps a failed source from the published snapshot and updates the rest', async () => {
    const result = await collectWithFallback(
      [broken('Superliga', ['masculina', 'feminina']), ok('nfl')],
      previous,
      now,
    );

    expect(result.kept).toEqual(['Superliga']);
    expect(result.competitions.map((c) => [c.name, c.updatedAt])).toEqual([
      ['Masculina antiga', previous.generatedAt],
      ['Feminina antiga', previous.generatedAt],
      ['nfl nova', now.toISOString()],
    ]);
  });

  it('treats a suspicious result like a failure', async () => {
    const tooSmall: Source = {
      name: 'NFL',
      slugs: ['nfl'],
      collect: async () => [{ ...competition('nfl', 'vazia'), teams: [] }],
    };

    const result = await collectWithFallback(
      [ok('masculina'), tooSmall],
      previous,
      now,
    );

    expect(result.kept).toEqual(['NFL']);
    expect(result.competitions[1].name).toBe('NFL antiga');
  });

  it('fails when a broken source has nothing to fall back on', async () => {
    await expect(
      collectWithFallback(
        [ok('nfl'), broken('Brasileirão', ['serie-a'])],
        previous,
        now,
      ),
    ).rejects.toThrow('Brasileirão: ge returned 503 (nothing to fall back on)');
    await expect(
      collectWithFallback([broken('NFL', ['nfl'])], null, now),
    ).rejects.toThrow('nothing to fall back on');
  });

  it('fails when every source failed, so the run shows it', async () => {
    await expect(
      collectWithFallback([broken('NFL', ['nfl'])], previous, now),
    ).rejects.toThrow('Every source failed');
  });
});

describe('fetchText', () => {
  const response = (status: number, body = '') =>
    ({ ok: status < 400, status, text: async () => body }) as Response;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /** Runs the request while letting the polite pauses and retry waits pass. */
  async function run(promise: Promise<string>) {
    const settled = promise.then(
      (value) => ({ value }),
      (error: Error) => ({ error }),
    );
    await jest.runAllTimersAsync();
    return settled;
  }

  it('retries timeouts and server errors, then returns the page', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('The operation was aborted'))
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(200, 'ok'));

    expect(await run(fetchText('https://ge/x'))).toEqual({ value: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('gives up after the last retry', async () => {
    fetchMock.mockResolvedValue(response(502));

    const result = await run(fetchText('https://ge/x'));

    expect(result).toEqual({ error: new Error('https://ge/x returned 502') });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry a status that will not change', async () => {
    fetchMock.mockResolvedValue(response(404));

    const result = await run(fetchText('https://ge/x'));

    expect(result).toEqual({ error: new Error('https://ge/x returned 404') });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
