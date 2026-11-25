import type {
  CompetitionSlug,
  MatchStatus,
  RaceSession,
  SessionKind,
} from '../../src/types/snapshot';
import { normalizeForSearch } from '../../src/utils/search.ts';
import { toChannels, toInstant } from '../brasileirao/parseGe.ts';

/**
 * The ge agenda (the service ge.globo.com/agenda queries, one date at a time)
 * lists every Formula 1 session as a "dispute": Brasília date and time, the
 * circuit and the broadcasters, grouped under a championship named after the
 * Grand Prix ("Grande Prêmio do Catar - Fórmula 1"). It has no results.
 */
export const AGENDA_QUERY = `
  query GetMotorsportAgenda($date: Date!) {
    multisportTabAgenda(filter: { date: $date }) {
      championshipsAgenda {
        championship { name }
        now: items(filter: { moment: NOW }) { ...dispute }
        past: items(filter: { moment: PAST }) { ...dispute }
        future: items(filter: { moment: FUTURE }) { ...dispute }
      }
    }
  }
  fragment dispute on DisputeEventKind {
    __typename
    modality { name }
    dispute {
      id startDate startHour moment
      phase { name }
      location { popularName }
      liveWatchSources { name }
    }
  }`;

/** The modality ge gives Formula 1 sessions; other series are skipped. */
const MODALITY = 'Fórmula 1';

type Raw = Record<string, unknown>;

const asObject = (value: unknown): Raw =>
  value && typeof value === 'object' ? (value as Raw) : {};

const asList = (value: unknown): Raw[] =>
  Array.isArray(value) ? value.map(asObject) : [];

const toText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const STATUS: Record<string, MatchStatus> = {
  PAST: 'finished',
  NOW: 'live',
  FUTURE: 'scheduled',
};

/** "Grande Prêmio do Catar - Fórmula 1" → "GP do Catar". */
export function toGrandPrix(championship: string): string {
  return championship
    .replace(/\s*-\s*F[óo]rmula 1\s*$/i, '')
    .replace(/^Grande Pr[êe]mio\b/i, 'GP')
    .trim();
}

/** What the session is, from its ge name. */
export function toKind(name: string): SessionKind {
  const text = normalizeForSearch(name);
  if (text.includes('treino livre')) return 'practice';
  if (text.includes('classificacao sprint')) return 'sprint-qualifying';
  if (text.includes('sprint')) return 'sprint';
  if (text.includes('classificacao')) return 'qualifying';
  if (text.startsWith('corrida')) return 'race';
  return 'other';
}

/** A weekend key that stays the same across runs: "gp-do-catar-2026". */
export function toGrandPrixId(grandPrix: string, startsAt: string): string {
  const slug = normalizeForSearch(grandPrix)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}-${startsAt.slice(0, 4)}`;
}

/** The Formula 1 sessions of one agenda answer. Throws on a service error. */
export function parseAgenda(
  json: string,
  competition: CompetitionSlug,
): RaceSession[] {
  const body = asObject(JSON.parse(json));
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    throw new Error(`ge agenda: ${JSON.stringify(body.errors).slice(0, 200)}`);
  }
  const tabs = asList(asObject(body.data).multisportTabAgenda);

  const sessions: RaceSession[] = [];
  for (const group of tabs.flatMap((tab) => asList(tab.championshipsAgenda))) {
    const championship = toText(asObject(group.championship).name);
    if (!championship) continue;
    const items = [
      ...asList(group.past),
      ...asList(group.now),
      ...asList(group.future),
    ];
    for (const item of items) {
      if (item.__typename !== 'DisputeEventKind') continue;
      if (toText(asObject(item.modality).name) !== MODALITY) continue;
      const dispute = asObject(item.dispute);
      const id = dispute.id;
      const name = toText(asObject(dispute.phase).name);
      const date = toText(dispute.startDate);
      const hour = toText(dispute.startHour);
      if ((typeof id !== 'number' && typeof id !== 'string') || !name) {
        continue;
      }
      // ge gives Brasília wall-clock time; toInstant adds the offset.
      const startsAt = date && hour ? toInstant(`${date}T${hour}`) : null;
      if (!startsAt) continue;
      const grandPrix = toGrandPrix(championship);
      sessions.push({
        id: String(id),
        competition,
        grandPrixId: toGrandPrixId(grandPrix, startsAt),
        grandPrix,
        name,
        kind: toKind(name),
        startsAt,
        status: STATUS[toText(dispute.moment) ?? ''] ?? 'scheduled',
        channels: toChannels(
          asList(dispute.liveWatchSources).map((source) => source.name),
        ),
        circuit: toText(asObject(dispute.location).popularName),
      });
    }
  }
  return sessions;
}
