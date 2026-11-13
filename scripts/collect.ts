import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Snapshot } from '../src/types/snapshot';
import { collectSerieA } from './brasileirao/collect.ts';
import { toLegacySnapshot } from './legacy.ts';
import { collectSuperliga } from './superliga/collect.ts';
import { assertValidSnapshot } from './validate.ts';

export const SNAPSHOT_FILE = 'onde-passa.json';
/** Read by the first app release; see legacy.ts. */
export const LEGACY_FILE = 'superliga.json';

/**
 * Usage: collect.ts <output dir> [dir with saved pages, skips the network]
 * Writes onde-passa.json (every competition) and superliga.json (legacy).
 */
async function main(): Promise<void> {
  const [outputDir, fixturesDir] = process.argv.slice(2);
  if (!outputDir) throw new Error('Missing the output directory');

  const competitions = [
    ...(await collectSuperliga(fixturesDir)),
    await collectSerieA(fixturesDir),
  ];

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
      `${c.name}: ${c.teams.length} teams, ${c.matches.length} matches, ${c.transfers?.length ?? 0} transfers`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
