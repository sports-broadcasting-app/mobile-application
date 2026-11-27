import { readFile, writeFile } from 'node:fs/promises';
import { isSnapshot } from '../../src/utils/guards.ts';
import { parseJson } from '../../src/utils/json.ts';
import { resolveTransfers, toTransferFile } from './transfers.ts';

const TRANSFERS_FILE = new URL('./transfers.json', import.meta.url);

/**
 * Usage: applyTransfers.ts <onde-passa.json>
 * Rewrites an existing snapshot with the current transfers.json, so the list
 * can be tried locally without collecting from the CBV again.
 */
async function main(): Promise<void> {
  const [path] = process.argv.slice(2);
  if (!path) throw new Error('Missing the snapshot path');

  const snapshot = parseJson(await readFile(path, 'utf8'));
  if (!isSnapshot(snapshot)) throw new Error(`${path} is not a snapshot`);
  const transferFile = toTransferFile(
    parseJson(await readFile(TRANSFERS_FILE, 'utf8')),
  );

  for (const competition of snapshot.competitions) {
    if (competition.sport !== 'volei') continue;
    competition.transfers = resolveTransfers(
      competition.slug,
      transferFile[competition.slug] ?? [],
      competition.teams,
    );
    console.log(
      `${competition.name}: ${competition.transfers.length} transfers`,
    );
  }
  snapshot.generatedAt = new Date().toISOString();

  await writeFile(path, JSON.stringify(snapshot));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
