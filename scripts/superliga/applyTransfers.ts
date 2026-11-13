import { readFile, writeFile } from 'node:fs/promises';
import type { SuperligaSnapshot } from '../../src/types/superliga';
import { resolveTransfers, type TransferFile } from './transfers.ts';

const TRANSFERS_FILE = new URL('./transfers.json', import.meta.url);

/**
 * Usage: applyTransfers.ts <snapshot.json>
 * Rewrites an existing snapshot with the current transfers.json, so the list
 * can be tried locally without collecting from the CBV again.
 */
async function main(): Promise<void> {
  const [path] = process.argv.slice(2);
  if (!path) throw new Error('Missing the snapshot path');

  const snapshot = JSON.parse(
    await readFile(path, 'utf8'),
  ) as SuperligaSnapshot;
  const transferFile = JSON.parse(
    await readFile(TRANSFERS_FILE, 'utf8'),
  ) as TransferFile;

  for (const competition of snapshot.competitions) {
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
