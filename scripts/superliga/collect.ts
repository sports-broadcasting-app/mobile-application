import { readFile } from 'node:fs/promises';
import type {
  CompetitionData,
  CompetitionSlug,
} from '../../src/types/snapshot';
import type { SourceIO } from '../source.ts';
import { parseJson } from '../../src/utils/json.ts';
import { buildCompetition } from './parseCbv.ts';
import { resolveTransfers, toTransferFile } from './transfers.ts';

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
  io: SourceIO,
): Promise<CompetitionData> {
  const agenda = await io.get(`${BASE_URL}/${path}`, `${slug}-agenda.html`);
  const standings = await io.get(
    `${BASE_URL}/${path}/classificacao`,
    `${slug}-classificacao.html`,
  );
  return buildCompetition(slug, name, SEASON, agenda, standings);
}

/**
 * Both Superligas from the CBV site, with the curated transfers merged in.
 * Offline, reads `{slug}-agenda.html` and `{slug}-classificacao.html`.
 */
export async function collectSuperliga(
  io: SourceIO,
): Promise<CompetitionData[]> {
  const transferFile = toTransferFile(
    parseJson(await readFile(TRANSFERS_FILE, 'utf8')),
  );

  const competitions: CompetitionData[] = [];
  for (const { slug, name, path } of COMPETITIONS) {
    const competition = await collect(slug, name, path, io);
    competition.transfers = resolveTransfers(
      slug,
      transferFile[slug] ?? [],
      competition.teams,
    );
    competitions.push(competition);
  }
  return competitions;
}
