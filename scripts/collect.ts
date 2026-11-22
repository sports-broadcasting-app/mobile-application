import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CompetitionSlug, Snapshot } from '../src/types/snapshot';
import { collectSerieA } from './brasileirao/collect.ts';
import { addNbaQuarters } from './apiSports/nba.ts';
import { addNflScores } from './bigBalls/nfl.ts';
import { collectWithFallback, loadPrevious } from './fallback.ts';
import { fetchText } from './http.ts';
import { collectNba } from './nba/collect.ts';
import { collectNfl } from './nfl/collect.ts';
import { toLegacySnapshot } from './legacy.ts';
import { collectSuperliga } from './superliga/collect.ts';
import { assertValidSnapshot } from './validate.ts';

export const SNAPSHOT_FILE = 'onde-passa.json';
/** Read by the first app release; see legacy.ts. */
export const LEGACY_FILE = 'superliga.json';

/**
 * Usage: collect.ts <output dir> [dir with saved pages, skips the network]
 * Writes onde-passa.json (every competition) and superliga.json (legacy).
 * With PREVIOUS_SNAPSHOT_URL (the published file), a source that fails keeps
 * its competitions from there instead of failing the whole run.
 */
async function main(): Promise<void> {
  const [outputDir, fixturesDir] = process.argv.slice(2);
  if (!outputDir) throw new Error('Missing the output directory');

  const previousUrl = process.env.PREVIOUS_SNAPSHOT_URL;
  const previous =
    previousUrl && !fixturesDir ? await loadPrevious(previousUrl) : null;

  const previousOf = (slug: CompetitionSlug) =>
    previous?.competitions.find((c) => c.slug === slug);

  const { competitions } = await collectWithFallback(
    [
      {
        name: 'Superliga (CBV)',
        slugs: ['masculina', 'feminina'],
        collect: () => collectSuperliga(fixturesDir),
      },
      {
        name: 'Brasileirão (ge)',
        slugs: ['serie-a'],
        collect: async () => [
          await collectSerieA(fixturesDir, Date.now(), previousOf('serie-a')),
        ],
      },
      {
        name: 'NFL (ge)',
        slugs: ['nfl'],
        collect: async () => {
          const nfl = await collectNfl(
            fixturesDir,
            Date.now(),
            previousOf('nfl'),
          );
          // Live and quarter scores come from Big Balls (ge has none);
          // offline runs skip it.
          console.log(
            await addNflScores(nfl, previousOf('nfl'), {
              key: fixturesDir ? undefined : process.env.BIGBALLS_KEY,
              now: Date.now(),
              fetchText: (url, key) =>
                fetchText(url, { headers: { 'x-api-key': key } }),
            }),
          );
          return [nfl];
        },
      },
      {
        name: 'NBA (ge)',
        slugs: ['nba'],
        collect: async () => {
          const nba = await collectNba(
            fixturesDir,
            Date.now(),
            previousOf('nba'),
          );
          // Quarters come from API-Sports (ge has none); offline runs skip it.
          console.log(
            await addNbaQuarters(nba, previousOf('nba'), {
              key: fixturesDir ? undefined : process.env.API_SPORTS_KEY,
              now: Date.now(),
              fetchText: (url, key) =>
                fetchText(url, { headers: { 'x-apisports-key': key } }),
            }),
          );
          return [nba];
        },
      },
    ],
    previous,
  );

  const snapshot: Snapshot = {
    version: 2,
    generatedAt: new Date().toISOString(),
    competitions,
  };
  assertValidSnapshot(snapshot);

  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, SNAPSHOT_FILE), JSON.stringify(snapshot));
  await writeFile(
    join(outputDir, LEGACY_FILE),
    JSON.stringify(toLegacySnapshot(snapshot)),
  );

  for (const c of competitions) {
    console.log(
      `${c.name}: ${c.teams.length} teams, ${c.matches.length} matches, ${c.transfers?.length ?? 0} transfers, updated ${c.updatedAt}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
