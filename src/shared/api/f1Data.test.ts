import {
  getEventStarts,
  getGrandPrix,
  getNextSessions,
  getSessionsBetween,
  getUpcomingSessions,
  saveSnapshot,
} from './database';
import { isGameOn } from './sync/syncService';
import { keepKnownCompetitions, withSeries } from './sync/snapshotService';
import {
  buildF1Series,
  buildSnapshot,
  raceSessions,
  scheduledMatch,
} from '@/test/fixtures';
import {
  describeSession,
  formatWeekend,
  groupByDay,
  groupByGrandPrix,
} from '@/entities/session/lib/sessions';
import {
  buildSessionReminders,
  REMINDER_LEAD_MS,
} from '@/features/reminders/lib/reminders';
import { resolveNewCompetitions } from '@/entities/competition/model/CompetitionContext';

jest.mock('expo-sqlite', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@/test/sqlite').createExpoSqliteMock(),
);

const published = () => ({
  ...buildSnapshot([scheduledMatch]),
  series: [buildF1Series()],
});

describe('Formula 1 in the snapshot', () => {
  it('turns the published series into a competition with sessions', () => {
    const snapshot = keepKnownCompetitions(withSeries(published()));
    expect(snapshot.series).toBeUndefined();
    const f1 = snapshot.competitions.find((c) => c.slug === 'f1');
    expect(f1?.sessions).toHaveLength(3);
    expect(f1?.teams).toEqual([]);
  });

  it('stores the sessions and reads them by day, weekend and kind', async () => {
    await saveSnapshot(withSeries(published()), {
      syncedAt: 1000,
      key: 'k1000',
      etag: null,
    });
    const friday = Date.parse('2026-11-27T00:00:00-03:00');
    const saturday = Date.parse('2026-11-28T00:00:00-03:00');
    expect(
      (await getSessionsBetween(friday, saturday)).map((s) => s.id),
    ).toEqual(['7234']);
    expect(
      (await getNextSessions(saturday, 6, ['f1'])).map((s) => s.id),
    ).toEqual(['7237', '7238']);
    expect(await getNextSessions(saturday, 6, ['nfl'])).toEqual([]);
    expect((await getGrandPrix('gp-do-catar-2026')).map((s) => s.name)).toEqual(
      ['1º treino livre', 'Classificação', 'Corrida'],
    );
    expect(
      (
        await getUpcomingSessions(['f1'], ['race', 'qualifying'], friday, 10)
      ).map((s) => s.kind),
    ).toEqual(['qualifying', 'race']);
    expect(await getEventStarts(friday, saturday, ['f1'])).toEqual([
      Date.parse(raceSessions[0]!.startsAt),
    ]);
  });
});

describe('session helpers', () => {
  it('groups by weekend and by day, and spells the weekend', () => {
    expect(groupByGrandPrix(raceSessions)).toHaveLength(1);
    expect(groupByDay(raceSessions).map((d) => d.sessions.length)).toEqual([
      1, 1, 1,
    ]);
    expect(formatWeekend(raceSessions)).toBe('27 a 29/11');
  });

  it('describes a session for screen readers', () => {
    expect(describeSession(raceSessions[0]!)).toBe(
      'GP do Catar, 1º treino livre. 10:30. Onde passa: SporTV, Globoplay',
    );
    expect(describeSession(raceSessions[2]!)).toMatch(/Transmissão a definir/);
  });

  it('warns 30 minutes before a session and opens its weekend', () => {
    const now = Date.parse('2026-11-26T12:00:00-03:00');
    const [reminder] = buildSessionReminders([raceSessions[2]!], now);
    expect(reminder).toEqual({
      id: 'session-7238',
      matchId: 'session-7238',
      path: '/grand-prix/gp-do-catar-2026',
      fireAt: Date.parse(raceSessions[2]!.startsAt) - REMINDER_LEAD_MS,
      title: 'GP do Catar: Corrida em 30 min',
      body: 'F1 · 13:00 · Transmissão a confirmar',
    });
  });

  it('counts a session around its start as a game on', () => {
    const start = Date.parse(raceSessions[2]!.startsAt);
    expect(isGameOn(raceSessions[2]!, start + 30 * 60 * 1000)).toBe(true);
    expect(isGameOn(raceSessions[2]!, start - 2 * 60 * 60 * 1000)).toBe(false);
  });
});

describe('new competitions', () => {
  it('offers Formula 1 to installs that chose before it existed', () => {
    expect(
      resolveNewCompetitions(
        ['serie-a', 'nfl'],
        ['masculina', 'feminina', 'serie-a', 'nfl', 'nba'],
      ),
    ).toEqual({
      followed: ['serie-a', 'nfl'],
      known: ['masculina', 'feminina', 'serie-a', 'nfl', 'nba'],
      news: ['f1'],
    });
  });

  it('follows a new competition of a sport already followed', () => {
    // An install that knew only the men's Superliga gets the women's one.
    expect(
      resolveNewCompetitions(
        ['masculina'],
        ['masculina', 'serie-a', 'nfl', 'nba', 'f1'],
      ),
    ).toEqual({
      followed: ['masculina', 'feminina'],
      known: ['masculina', 'feminina', 'serie-a', 'nfl', 'nba', 'f1'],
      news: [],
    });
  });
});
