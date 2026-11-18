import type {
  CompetitionData,
  CompetitionSlug,
  Snapshot,
} from '../src/types/snapshot';
import { fetchText } from './http.ts';
import { assertValidCompetition } from './validate.ts';

/** One site the collector reads; the Superliga page yields two competitions. */
export interface Source {
  name: string;
  slugs: CompetitionSlug[];
  collect: () => Promise<CompetitionData[]>;
}

export interface CollectResult {
  competitions: CompetitionData[];
  /** Sources that failed and were replaced by the published data. */
  kept: string[];
}

/**
 * Collects every source, so one site being down or changing its page does not
 * freeze the others: a failed or suspicious source keeps its competitions
 * from the snapshot already online (with their old `updatedAt`). Throws when
 * a failed source has nothing to fall back on, or when every source failed,
 * since republishing the same data would only hide the problem.
 */
export async function collectWithFallback(
  sources: Source[],
  previous: Snapshot | null,
  now = new Date(),
): Promise<CollectResult> {
  const competitions: CompetitionData[] = [];
  const kept: string[] = [];

  for (const source of sources) {
    try {
      const collected = await source.collect();
      collected.forEach(assertValidCompetition);
      competitions.push(
        ...collected.map((c) => ({ ...c, updatedAt: now.toISOString() })),
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const old = source.slugs.map((slug) =>
        previous?.competitions.find((c) => c.slug === slug),
      );
      if (!previous || old.some((c) => c === undefined)) {
        throw new Error(`${source.name}: ${reason} (nothing to fall back on)`);
      }
      // A GitHub Actions annotation: the run stays green but shows it.
      console.log(
        `::warning title=${source.name} kept from the last run::${reason}`,
      );
      competitions.push(
        ...(old as CompetitionData[]).map((c) => ({
          ...c,
          updatedAt: c.updatedAt ?? previous.generatedAt,
        })),
      );
      kept.push(source.name);
    }
  }

  if (sources.length > 0 && kept.length === sources.length) {
    throw new Error('Every source failed; keeping the published snapshot');
  }
  return { competitions, kept };
}

/** The snapshot online now, or null when it cannot be read. */
export async function loadPrevious(url: string): Promise<Snapshot | null> {
  try {
    const snapshot = JSON.parse(await fetchText(url)) as Snapshot;
    if (snapshot.version !== 2 || !Array.isArray(snapshot.competitions)) {
      throw new Error(`unexpected snapshot version ${snapshot.version}`);
    }
    return snapshot;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.log(`::warning title=No previous snapshot::${reason}`);
    return null;
  }
}
