import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  CompetitionData,
  CompetitionSlug,
} from '../../src/types/snapshot';
import { download } from '../http.ts';
import { buildCompetition } from './parseCbv.ts';
import { resolveTransfers, type TransferFile } from './transfers.ts';

/** Hand-curated from news articles; see the README. */
const TRANSFERS_FILE = new URL('./transfers.json', import.meta.url);

const BASE_URL = 'https://cbv.com.br/volei-de-quadra';
const SEASON = '2026/27';

const COMPETITIONS: { slug: CompetitionSlug; name: string; path: string }[] = [
  {
    slug: 'masculina',
    name: 'Superliga Masculina',
    path: 'superliga-a-masculina',
  },
  {
    slug: 'feminina',
    name: 'Superliga Feminina',
    path: 'superliga-a-feminina',
  },
];

async function collect(
  slug: CompetitionSlug,
  name: string,
  path: string,
  fixturesDir?: string,
): Promise<CompetitionData> {
  const [agenda, standings] = fixturesDir
    ? await Promise.all([
        readFile(join(fixturesDir, `${slug}-agenda.html`), 'utf8'),
        readFile(join(fixturesDir, `${slug}-classificacao.html`), 'utf8'),
      ])
    : [
        await download(`${BASE_URL}/${path}`),
        await download(`${BASE_URL}/${path}/classificacao`),
      ];
  return buildCompetition(slug, name, SEASON, agenda, standings);
}

/**
 * Both Superligas from the CBV site, with the curated transfers merged in.
 * Offline, reads `{slug}-agenda.html` and `{slug}-classificacao.html`.
 */
export async function collectSuperliga(
  fixturesDir?: string,
): Promise<CompetitionData[]> {
  const transferFile = JSON.parse(
    await readFile(TRANSFERS_FILE, 'utf8'),
  ) as TransferFile;

  const competitions: CompetitionData[] = [];
  for (const { slug, name, path } of COMPETITIONS) {
    const competition = await collect(slug, name, path, fixturesDir);
    competition.transfers = resolveTransfers(
      slug,
      transferFile[slug] ?? [],
      competition.teams,
    );
    competitions.push(competition);
  }
  return competitions;
}
