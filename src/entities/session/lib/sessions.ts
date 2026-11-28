import { RaceSession, SessionKind } from '@/shared/api/snapshot';
import { formatDay, formatTime } from '@/shared/lib/date';

export interface GrandPrixGroup {
  grandPrixId: string;
  grandPrix: string;
  circuit: string | null;
  sessions: RaceSession[];
}

/** Sessions grouped by weekend, in the order of their first session. */
export function groupByGrandPrix(sessions: RaceSession[]): GrandPrixGroup[] {
  const groups = new Map<string, GrandPrixGroup>();
  for (const session of [...sessions].sort(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
  )) {
    const group = groups.get(session.grandPrixId) ?? {
      grandPrixId: session.grandPrixId,
      grandPrix: session.grandPrix,
      circuit: session.circuit,
      sessions: [],
    };
    group.sessions.push(session);
    groups.set(session.grandPrixId, group);
  }
  return [...groups.values()];
}

/** Sessions of a weekend split by local day, for the Grand Prix screen. */
export function groupByDay(
  sessions: RaceSession[],
): { day: string; sessions: RaceSession[] }[] {
  const days: { day: string; sessions: RaceSession[] }[] = [];
  for (const session of sessions) {
    const day = formatDay(new Date(session.startsAt));
    const last = days[days.length - 1];
    if (last?.day === day) last.sessions.push(session);
    else days.push({ day, sessions: [session] });
  }
  return days;
}

/** "27 a 29/11", or "30/11 a 1/12" across months. */
export function formatWeekend(sessions: RaceSession[]): string {
  const [opening] = sessions;
  const closing = sessions.at(-1);
  if (!opening || !closing) return '';
  const first = new Date(opening.startsAt);
  const last = new Date(closing.startsAt);
  const month = (date: Date) => date.getMonth() + 1;
  if (first.toDateString() === last.toDateString()) {
    return `${first.getDate()}/${month(first)}`;
  }
  return month(first) === month(last)
    ? `${first.getDate()} a ${last.getDate()}/${month(last)}`
    : `${first.getDate()}/${month(first)} a ${last.getDate()}/${month(last)}`;
}

/** The session kinds a reminder can be set for, in the sheet's order. */
export const REMINDER_KINDS: {
  kind: SessionKind;
  label: string;
  detail: string;
}[] = [
  { kind: 'race', label: 'Corrida', detail: 'Domingo' },
  { kind: 'qualifying', label: 'Classificação', detail: 'Define o grid' },
  {
    kind: 'sprint',
    label: 'Corrida Sprint',
    detail: 'Só em fins de semana com sprint',
  },
  {
    kind: 'sprint-qualifying',
    label: 'Classificação Sprint',
    detail: 'Só em fins de semana com sprint',
  },
  { kind: 'practice', label: 'Treinos livres', detail: 'Sexta e sábado' },
];

/** On until the user changes them: the sessions most people watch. */
export const DEFAULT_REMINDER_KINDS: SessionKind[] = ['race', 'qualifying'];

/** The plural the bell of a session speaks for ("as corridas"). */
export function kindPlural(kind: SessionKind): string {
  return (
    {
      race: 'as corridas',
      qualifying: 'as classificações',
      sprint: 'as corridas sprint',
      'sprint-qualifying': 'as classificações sprint',
      practice: 'os treinos livres',
      other: 'as outras sessões',
    } satisfies Record<SessionKind, string>
  )[kind];
}

/** What a screen reader says for a session row. */
export function describeSession(
  session: RaceSession,
  details: string[] = [],
): string {
  const status =
    session.status === 'live'
      ? 'ao vivo'
      : session.status === 'finished'
        ? 'encerrada'
        : session.status === 'postponed'
          ? 'adiada'
          : null;
  const where =
    session.channels.length > 0
      ? `Onde passa: ${session.channels.join(', ')}`
      : session.status === 'scheduled'
        ? 'Transmissão a definir'
        : null;
  return [
    `${session.grandPrix}, ${session.name}`,
    ...details,
    formatTime(session.startsAt),
    status,
    where,
  ]
    .filter(Boolean)
    .join('. ');
}
