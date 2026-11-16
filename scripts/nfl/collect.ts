import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CompetitionData, Match, Team } from '../../src/types/snapshot';
import { download, postJson } from '../http.ts';
import {
  parseMatches,
  parseStandingsPage,
  type NflFilter,
  type NflPhase,
} from './parseGe.ts';

const SLUG = 'nfl';
const NAME = 'NFL';
const PAGE_URL = 'https://ge.globo.com/futebol-americano/nfl/classificacao/';
/** The service the standings page itself queries for each week. */
const GRAPHQL_URL = 'https://geql.globo.com/graphql';

/** Only the fields the parser reads, so a schema change elsewhere is harmless. */
const MATCHES_QUERY = `
  query GetMultisportMatchesByPhase($multisportMatchesByPhaseFilter: MultisportMatchesByPhaseFilter!) {
    multisportMatchesByPhase(filter: $multisportMatchesByPhaseFilter) {
      __typename
      ... on MatchEventKind {
        match {
          id startDate startHour round moment
          firstContestant { __typename ... on Team { id name popularName abbreviation badge(format: "svg") } }
          secondContestant { __typename ... on Team { id name popularName abbreviation badge(format: "svg") } }
          scoreboard { home away }
          location { name popularName }
          phase { name }
          liveWatchSources { name }
        }
      }
    }
  }`;

/** Reads one offline fixture, or null when it was not saved. */
async function readFixture(dir: string, file: string): Promise<string | null> {
  try {
    return await readFile(join(dir, file), 'utf8');
  } catch {
    return null;
  }
}

function roundFile(phase: NflPhase, round: number): string {
  return `${SLUG}-${phase.slug}-rodada-${round}.json`;
}

function roundLabel(phase: NflPhase, round: number): string {
  return phase.knockout ? phase.name : `Semana ${round}`;
}

/**
 * Playoff phases exist on the page before they are played; the service
 * answers them with an error. A knockout phase is asked for once the season
 * reached it: it is the current one or comes before the current one.
 */
function isPlayable(phase: NflPhase, phases: NflPhase[]): boolean {
  if (!phase.knockout) return true;
  const current = phases.findIndex((p) => p.actual);
  return current !== -1 && phases.indexOf(phase) <= current;
}

async function fetchRound(
  filter: NflFilter,
  phase: NflPhase,
  round: number,
): Promise<string> {
  return postJson(GRAPHQL_URL, {
    operationName: 'GetMultisportMatchesByPhase',
    variables: {
      multisportMatchesByPhaseFilter: {
        ...filter,
        phaseSlug: phase.slug,
        round,
      },
    },
    query: MATCHES_QUERY,
  });
}

/**
 * NFL from ge: the standings page embeds the season phases and the table by
 * division, and the matches service gives each week with the Brazilian
 * broadcasters. Offline, reads `nfl-classificacao.html` and the optional
 * `nfl-{phase}-rodada-{n}.json` files.
 */
export async function collectNfl(
  fixturesDir?: string,
  now = Date.now(),
): Promise<CompetitionData> {
  const pageHtml = fixturesDir
    ? await readFile(join(fixturesDir, `${SLUG}-classificacao.html`), 'utf8')
    : await download(PAGE_URL);
  const page = parseStandingsPage(pageHtml);
  const knownTeams = new Map(page.teams.map((team) => [team.id, team]));
  const matches: Match[] = [];

  for (const phase of page.phases) {
    if (!isPlayable(phase, page.phases)) continue;
    for (let round = 1; round <= phase.rounds; round++) {
      const json = fixturesDir
        ? await readFixture(fixturesDir, roundFile(phase, round))
        : await fetchRound(page.filter, phase, round);
      if (json === null) continue;
      const parsed = parseMatches(
        json,
        { number: round, label: roundLabel(phase, round) },
        SLUG,
        now,
      );
      matches.push(...parsed.matches);
      for (const team of parsed.teams) {
        if (!knownTeams.has(team.id)) knownTeams.set(team.id, team);
      }
    }
  }

  matches.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));

  return {
    slug: SLUG,
    sport: 'futebol-americano',
    name: NAME,
    season: page.season,
    teams: [...knownTeams.values()] as Team[],
    matches,
    standings: page.standings,
  };
}
