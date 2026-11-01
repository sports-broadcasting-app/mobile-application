import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type {
  CompetitionData,
  CompetitionSlug,
  SuperligaSnapshot,
} from '../../src/types/superliga';
import { assertValidSnapshot, buildCompetition } from './parseCbv.ts';

const BASE_URL = 'https://cbv.com.br/volei-de-quadra';
const USER_AGENT =
  'WhereToWatchCollector/1.0 (+https://github.com/sports-broadcasting-app/mobile-application)';
const SEASON = '2026/27';
const REQUEST_INTERVAL_MS = 2000;

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

async function download(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL_MS));
  return response.text();
}

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
  return buildCompetition(slug, name, agenda, standings);
}

/** Usage: collect.ts <output.json> [dir with saved html, skips the network] */
async function main(): Promise<void> {
  const [output, fixturesDir] = process.argv.slice(2);
  if (!output) throw new Error('Missing the output path');

  const competitions: CompetitionData[] = [];
  for (const { slug, name, path } of COMPETITIONS) {
    competitions.push(await collect(slug, name, path, fixturesDir));
  }

  const snapshot: SuperligaSnapshot = {
    version: 1,
    generatedAt: new Date().toISOString(),
    season: SEASON,
    competitions,
  };
  assertValidSnapshot(snapshot);

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(snapshot));
  for (const c of competitions) {
    console.log(
      `${c.name}: ${c.teams.length} teams, ${c.matches.length} matches`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
