import { collectF1, datesToAsk } from './collect';
import { parseAgenda, toGrandPrix, toGrandPrixId, toKind } from './parseGe';
import { toPublished } from '../fallback';
import { assertValidCompetition, assertValidSnapshot } from '../validate';
import type {
  CompetitionData,
  RaceSession,
} from '../../src/shared/api/snapshot';

/** One ge agenda session, as the service answers it. */
function dispute(
  id: number,
  phase: string,
  date: string,
  hour: string,
  moment = 'FUTURE',
  channels = ['sportv', 'globoplay'],
) {
  return {
    __typename: 'DisputeEventKind',
    modality: { name: 'Fórmula 1' },
    dispute: {
      id,
      startDate: date,
      startHour: hour,
      moment,
      phase: { name: phase },
      location: { popularName: 'Circuito Internacional de Lusail' },
      liveWatchSources: channels.map((name) => ({ name })),
    },
  };
}

type Item = ReturnType<typeof dispute>;

function agenda(items: Item[]) {
  const by = (moment: string) =>
    items.filter((i) => i.dispute.moment === moment);
  return JSON.stringify({
    data: {
      multisportTabAgenda: [
        {
          championshipsAgenda: [
            {
              championship: { name: 'Grande Prêmio do Catar - Fórmula 1' },
              past: by('PAST'),
              now: by('NOW'),
              future: by('FUTURE'),
            },
            // Other sports come in the same answer.
            {
              championship: { name: 'NBA' },
              past: [],
              now: [],
              future: [{ __typename: 'MatchEventKind' }],
            },
          ],
        },
      ],
    },
  });
}

describe('F1 agenda parser', () => {
  it('names the weekend and the kind of each session', () => {
    expect(toGrandPrix('Grande Prêmio do Catar - Fórmula 1')).toBe(
      'GP do Catar',
    );
    expect(toKind('1º treino livre')).toBe('practice');
    expect(toKind('Classificação Sprint')).toBe('sprint-qualifying');
    expect(toKind('Corrida Sprint')).toBe('sprint');
    expect(toKind('Classificação')).toBe('qualifying');
    expect(toKind('Corrida')).toBe('race');
    expect(toKind('Desfile dos pilotos')).toBe('other');
    expect(toGrandPrixId('GP de São Paulo', '2026-11-08T14:00:00-03:00')).toBe(
      'gp-de-sao-paulo-2026',
    );
  });

  it('reads Formula 1 sessions with Brasília time and broadcasters', () => {
    const [session] = parseAgenda(
      agenda([dispute(7238, 'Corrida', '2026-11-29', '13:00:00')]),
      'f1',
    );
    expect(session).toEqual({
      id: '7238',
      competition: 'f1',
      grandPrixId: 'gp-do-catar-2026',
      grandPrix: 'GP do Catar',
      name: 'Corrida',
      kind: 'race',
      startsAt: '2026-11-29T13:00:00-03:00',
      status: 'scheduled',
      channels: ['SporTV', 'Globoplay'],
      circuit: 'Circuito Internacional de Lusail',
    });
  });

  it('maps ge moments to statuses and skips other series', () => {
    const other = {
      ...dispute(1, 'Corrida', '2026-11-29', '10:00:00'),
      modality: { name: 'Fórmula 2' },
    };
    const sessions = parseAgenda(
      agenda([
        dispute(10, '1º treino livre', '2026-11-27', '10:30:00', 'PAST'),
        dispute(11, '2º treino livre', '2026-11-27', '14:00:00', 'NOW'),
        other,
      ]),
      'f1',
    );
    expect(sessions.map((s) => [s.id, s.status])).toEqual([
      ['10', 'finished'],
      ['11', 'live'],
    ]);
  });

  it('throws on a service error', () => {
    expect(() =>
      parseAgenda(JSON.stringify({ errors: [{ message: 'boom' }] }), 'f1'),
    ).toThrow('ge agenda');
  });
});

describe('collectF1', () => {
  // Wednesday 25/11, 12:00 in Brasília.
  const NOW = Date.parse('2026-11-25T12:00:00-03:00');
  const session = (over: Partial<RaceSession>): RaceSession => ({
    id: '1',
    competition: 'f1',
    grandPrixId: 'gp-do-catar-2026',
    grandPrix: 'GP do Catar',
    name: 'Corrida',
    kind: 'race',
    startsAt: '2026-11-29T13:00:00-03:00',
    status: 'scheduled',
    channels: [],
    circuit: null,
    ...over,
  });
  const published = (sessions: RaceSession[]): CompetitionData => ({
    slug: 'f1',
    sport: 'automobilismo',
    name: 'Fórmula 1',
    season: '2026',
    teams: [],
    matches: [],
    standings: [],
    sessions,
  });

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('asks Thursday to Sunday of the next four weeks in a full run', () => {
    const dates = datesToAsk(NOW, undefined, false);
    expect(dates.slice(0, 5)).toEqual([
      '2026-11-26',
      '2026-11-27',
      '2026-11-28',
      '2026-11-29',
      '2026-12-03',
    ]);
    expect(dates).toHaveLength(16);
  });

  it('asks only the dates of sessions in their window in a live run', () => {
    const during = Date.parse('2026-11-29T13:30:00-03:00');
    const previous = published([
      session({ id: '1' }),
      session({ id: '2', startsAt: '2026-12-06T10:00:00-03:00' }),
    ]);
    expect(datesToAsk(during, previous, true)).toEqual(['2026-11-29']);
  });

  it('replaces asked dates and keeps the rest of the season', async () => {
    const previous = published([
      // Las Vegas, last weekend: not asked again, closed as finished.
      session({
        id: '9',
        grandPrixId: 'gp-de-las-vegas-2026',
        startsAt: '2026-11-22T01:00:00-03:00',
        status: 'live',
      }),
      // Dropped by ge on a date it answered: goes away.
      session({ id: '8', startsAt: '2026-11-29T09:00:00-03:00' }),
    ]);
    const f1 = await collectF1({
      now: NOW,
      previous,
      live: false,
      fetchAgenda: async (date) =>
        date === '2026-11-29'
          ? agenda([dispute(7238, 'Corrida', '2026-11-29', '13:00:00')])
          : agenda([]),
    });
    expect(f1.sessions?.map((s) => [s.id, s.status])).toEqual([
      ['9', 'finished'],
      ['7238', 'scheduled'],
    ]);
    expect(f1.teams).toEqual([]);
    assertValidCompetition(f1);
  });

  it('fails instead of emptying the calendar when ge answers no session', async () => {
    await expect(
      collectF1({
        now: NOW,
        previous: published([session({ id: '7238' })]),
        live: false,
        fetchAgenda: async () => agenda([]),
      }),
    ).rejects.toThrow('no session');
  });

  it('publishes Formula 1 in series, never in competitions', () => {
    const f1 = published([session({})]);
    const snapshot = toPublished('2026-11-25T15:00:00Z', [f1]);
    expect(snapshot.competitions).toEqual([]);
    expect(snapshot.series).toEqual([f1]);
    // Builds before 1.5 reject the file over a competition without teams.
    expect(() =>
      assertValidSnapshot({
        version: 2,
        generatedAt: '2026-11-25T15:00:00Z',
        competitions: [f1],
      }),
    ).toThrow('belongs in series');
  });
});
