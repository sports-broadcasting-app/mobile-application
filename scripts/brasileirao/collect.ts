import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CompetitionData, Team } from '../../src/types/snapshot';
import { download } from '../http.ts';
import {
  parseChannels,
  parseRound,
  parseStandings,
  parseTablePage,
  type RoundMatch,
} from './parseGe.ts';

const SLUG = 'serie-a';
const NAME = 'Brasileirão Série A';
const PAGE_URL = 'https://ge.globo.com/futebol/brasileirao-serie-a/';
/** The public service behind the ge championship page. */
const TABLE_URL = 'https://api.globoesporte.globo.com/tabela';
/** Broadcasters are only announced close to the match. */
const CHANNELS_WINDOW_MS = 8 * 24 * 60 * 60 * 1000;

/** Reads one offline fixture, or null when it was not saved. */
async function readFixture(dir: string, file: string): Promise<string | null> {
  try {
    return await readFile(join(dir, file), 'utf8');
  } catch {
    return null;
  }
}

function needsChannels({ match, pageUrl }: RoundMatch, now: number): boolean {
  if (!pageUrl || match.status === 'finished') return false;
  return Date.parse(match.startsAt) - now < CHANNELS_WINDOW_MS;
}

function matchPageFile(id: string): string {
  return `${SLUG}-jogo-${id}.html`;
}

/**
 * Brasileirão Série A from ge: the championship page names the table, the
 * table service gives standings and rounds, and each match page lists the
 * broadcasters. Offline, reads `serie-a-tabela.html`,
 * `serie-a-classificacao.json`, `serie-a-rodada-{n}.json` and the optional
 * `serie-a-jogo-{id}.html`.
 */
export async function collectSerieA(
  fixturesDir?: string,
  now = Date.now(),
): Promise<CompetitionData> {
  const pageHtml = fixturesDir
    ? await readFile(join(fixturesDir, `${SLUG}-tabela.html`), 'utf8')
    : await download(PAGE_URL);
  const page = parseTablePage(pageHtml);
  const phaseUrl = `${TABLE_URL}/${page.tableId}/fase/${page.phaseSlug}`;

  const standingsJson = fixturesDir
    ? await readFile(join(fixturesDir, `${SLUG}-classificacao.json`), 'utf8')
    : await download(`${phaseUrl}/classificacao/`);
  const { teams, standings } = parseStandings(standingsJson);
  const knownTeams = new Map(teams.map((team) => [team.id, team]));

  const rounds: RoundMatch[] = [];
  for (let round = 1; round <= page.lastRound; round++) {
    const json = fixturesDir
      ? await readFixture(fixturesDir, `${SLUG}-rodada-${round}.json`)
      : await download(`${phaseUrl}/rodada/${round}/jogos/`);
    if (json === null) continue;
    const parsed = parseRound(json, round, SLUG, now);
    rounds.push(...parsed.matches);
    for (const team of parsed.teams) {
      if (!knownTeams.has(team.id)) knownTeams.set(team.id, team);
    }
  }

  for (const entry of rounds) {
    if (!needsChannels(entry, now)) continue;
    const html = fixturesDir
      ? await readFixture(fixturesDir, matchPageFile(entry.match.id))
      : await download(entry.pageUrl as string);
    if (html !== null) entry.match.channels = parseChannels(html);
  }

  const matches = rounds
    .map((entry) => entry.match)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const season = page.editionName.match(/\d{4}/)?.[0] ?? String(now);

  return {
    slug: SLUG,
    sport: 'futebol',
    name: NAME,
    season,
    teams: [...knownTeams.values()] as Team[],
    matches,
    standings,
  };
}
