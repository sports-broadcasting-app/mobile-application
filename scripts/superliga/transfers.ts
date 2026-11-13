import type {
  CompetitionSlug,
  Team,
  Transfer,
  TransferClub,
} from '../../src/types/snapshot';
import { normalizeForSearch } from '../../src/utils/search.ts';

/**
 * One hand-curated line of transfers.json. `from` and `to` are a Superliga
 * team code (as shown in the standings, e.g. "SDC") or any other club name.
 */
export interface TransferEntry {
  athlete: string;
  position?: string | null;
  from: string;
  to: string;
  date?: string | null;
  loan?: boolean;
  source: string;
}

export type TransferFile = Partial<Record<CompetitionSlug, TransferEntry[]>>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function resolveClub(value: string, teams: Team[]): TransferClub {
  const term = normalizeForSearch(value);
  const team = teams.find(
    (candidate) =>
      normalizeForSearch(candidate.code) === term ||
      normalizeForSearch(candidate.name) === term,
  );
  return team
    ? { teamId: team.id, name: team.name }
    : { teamId: null, name: value.trim() };
}

function toId(entry: TransferEntry): string {
  return normalizeForSearch(`${entry.athlete} ${entry.to}`)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Throws on any doubtful line so a typo never reaches the app. */
export function resolveTransfers(
  competition: string,
  entries: TransferEntry[],
  teams: Team[],
): Transfer[] {
  const seen = new Set<string>();

  return entries.map((entry, index) => {
    const where = `${competition} transfer #${index + 1}`;
    if (!entry.athlete?.trim()) throw new Error(`${where}: missing athlete`);
    if (!/^https?:\/\//.test(entry.source ?? '')) {
      throw new Error(`${where}: source must be the article URL`);
    }
    if (entry.date && !DATE.test(entry.date)) {
      throw new Error(`${where}: date must be YYYY-MM-DD`);
    }

    const from = resolveClub(entry.from, teams);
    const to = resolveClub(entry.to, teams);
    if (!from.teamId && !to.teamId) {
      throw new Error(
        `${where}: neither "${entry.from}" nor "${entry.to}" is a ${competition} team code`,
      );
    }

    const id = toId(entry);
    if (seen.has(id)) throw new Error(`${where}: duplicated`);
    seen.add(id);

    return {
      id,
      athleteName: entry.athlete.trim(),
      position: entry.position?.trim() || null,
      from,
      to,
      date: entry.date ?? null,
      loan: entry.loan ?? false,
      sourceUrl: entry.source,
    };
  });
}
