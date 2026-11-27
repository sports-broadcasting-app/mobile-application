import type {
  CompetitionData,
  CompetitionSlug,
  Snapshot,
} from '../src/types/snapshot';
import { fetchText } from './http.ts';
import { isSnapshot } from '../src/utils/guards.ts';
import { parseJson } from '../src/utils/json.ts';
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
 * from the snapshot already online (with their old `updatedAt`); one never
 * published yet (a new league) is left out. Throws when the published
 * snapshot could not be read, or when every source failed, since
 * republishing the same data would only hide the problem.
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
      if (!previous) {
        throw new Error(`${source.name}: ${reason} (nothing to fall back on)`);
      }
      // A league just added has never been published: leave it out for now
      // rather than holding back the others.
      if (old.every((c) => c === undefined)) {
        console.log(`::warning title=${source.name} left out::${reason}`);
        kept.push(source.name);
        continue;
      }
      if (old.some((c) => c === undefined)) {
        throw new Error(`${source.name}: ${reason} (nothing to fall back on)`);
      }
      // A GitHub Actions annotation: the run stays green but shows it.
      console.log(
        `::warning title=${source.name} kept from the last run::${reason}`,
      );
      competitions.push(
        ...old
          .filter((c): c is CompetitionData => c !== undefined)
          .map((c) => ({
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
    const snapshot = parseJson(await fetchText(url));
    if (!isSnapshot(snapshot)) {
      throw new Error('the published file is not a version 2 snapshot');
    }
    // Series are published apart (see toPublished) but are competitions
    // like the others inside the collector.
    const { series = [], ...rest } = snapshot;
    return {
      ...rest,
      competitions: [...snapshot.competitions, ...series],
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.log(`::warning title=No previous snapshot::${reason}`);
    return null;
  }
}

/**
 * The file as published: competitions without teams (Formula 1) go to
 * `series`, since builds before 1.5 reject the whole file when an entry of
 * `competitions` has no teams.
 */
export function toPublished(
  generatedAt: string,
  all: CompetitionData[],
): Snapshot {
  const competitions = all.filter((c) => !c.sessions);
  const series = all.filter((c) => c.sessions);
  return {
    version: 2,
    generatedAt,
    competitions,
    ...(series.length > 0 ? { series } : {}),
  };
}
