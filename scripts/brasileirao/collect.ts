import type {
  CompetitionData,
  MatchEvent,
} from '../../src/shared/api/snapshot';
import type { SourceIO } from '../source.ts';
import { inLiveWindow } from '../schedule.ts';
import {
  eventsMatchScore,
  parseChannels,
  parseEvents,
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
/**
 * Finished matches still without events whose page is read per run, most
 * recent first: the season's history fills in over a few runs instead of
 * one run asking for 350 pages.
 */
const EVENTS_BACKFILL_PER_RUN = 20;

function needsChannels({ match, pageUrl }: RoundMatch, now: number): boolean {
  if (!pageUrl || match.status === 'finished') return false;
  return Date.parse(match.startsAt) - now < CHANNELS_WINDOW_MS;
}

/**
 * Events from the published file, kept only while they still add up to the
 * score (a corrected score makes the match be read again).
 */
function reusableEvents(
  previous: CompetitionData | undefined,
): Map<string, MatchEvent[]> {
  const reusable = new Map<string, MatchEvent[]>();
  for (const match of previous?.matches ?? []) {
    if (match.status === 'finished' && match.events) {
      reusable.set(match.id, match.events);
    }
  }
  return reusable;
}

function matchPageFile(id: string): string {
  return `${SLUG}-jogo-${id}.html`;
}

/**
 * Brasileirão Série A from ge: the championship page names the table, the
 * table service gives standings and rounds, and each match page lists the
 * broadcasters and the live feed (goals, red cards). Offline, reads
 * `serie-a-tabela.html`, `serie-a-classificacao.json`,
 * `serie-a-rodada-{n}.json` and the optional `serie-a-jogo-{id}.html`.
 * `previous` (the published competition) lends the events of finished
 * matches, so their pages are read once. With `live` (and `previous`), only
 * the rounds with a game in its window are asked and only those games' pages
 * read; every other round, and the broadcasters already found, come from
 * `previous`.
 */
export async function collectSerieA(
  io: SourceIO,
  now = Date.now(),
  previous?: CompetitionData,
  { live = false }: { live?: boolean } = {},
): Promise<CompetitionData> {
  const liveRun = live && previous !== undefined && !io.offline;
  const previousById = new Map(previous?.matches.map((m) => [m.id, m]) ?? []);
  const liveRounds = new Set(
    (previous?.matches ?? [])
      .filter((m) => inLiveWindow(m, 'futebol', now))
      .map((m) => m.round),
  );
  const pageHtml = await io.get(PAGE_URL, `${SLUG}-tabela.html`);
  const page = parseTablePage(pageHtml);
  const phaseUrl = `${TABLE_URL}/${page.tableId}/fase/${page.phaseSlug}`;

  const standingsJson = await io.get(
    `${phaseUrl}/classificacao/`,
    `${SLUG}-classificacao.json`,
  );
  const { teams, standings } = parseStandings(standingsJson);
  const knownTeams = new Map(teams.map((team) => [team.id, team]));

  const rounds: RoundMatch[] = [];
  for (let round = 1; round <= page.lastRound; round++) {
    if (liveRun && !liveRounds.has(round)) {
      // Kept as published; no page to read (pageUrl null).
      for (const match of previous?.matches ?? []) {
        if (match.round === round)
          rounds.push({ match: { ...match }, pageUrl: null });
      }
      continue;
    }
    const json = await io.find(
      `${phaseUrl}/rodada/${round}/jogos/`,
      `${SLUG}-rodada-${round}.json`,
    );
    if (json === null) continue;
    const parsed = parseRound(json, round, SLUG, now);
    if (liveRun) {
      // Broadcasters of games outside the window are not read again.
      for (const { match } of parsed.matches) {
        match.channels = previousById.get(match.id)?.channels ?? [];
      }
    }
    rounds.push(...parsed.matches);
    for (const team of parsed.teams) {
      if (!knownTeams.has(team.id)) knownTeams.set(team.id, team);
    }
  }

  // Events: live matches always; finished ones from the published file, or
  // read once (a bounded number per run) when they have none yet.
  const reusable = reusableEvents(previous);
  const backfill = new Set(
    rounds
      .filter(
        ({ match, pageUrl }) =>
          pageUrl && match.status === 'finished' && !reusable.has(match.id),
      )
      .sort(
        (a, b) => Date.parse(b.match.startsAt) - Date.parse(a.match.startsAt),
      )
      .slice(0, io.offline ? Infinity : EVENTS_BACKFILL_PER_RUN)
      .map(({ match }) => match.id),
  );
  let eventPages = 0;
  let keptEvents = 0;

  for (const entry of rounds) {
    const { match } = entry;
    const kept = reusable.get(match.id);
    if (
      kept &&
      match.status === 'finished' &&
      eventsMatchScore(kept, match.homeScore, match.awayScore)
    ) {
      match.events = kept;
      keptEvents++;
    }

    const channels =
      needsChannels(entry, now) &&
      (!liveRun || inLiveWindow(match, 'futebol', now));
    const events =
      !match.events &&
      Boolean(entry.pageUrl) &&
      (match.status === 'live' || backfill.has(match.id));
    if (!channels && !events) continue;

    // Offline, the saved page stands in even when ge gave no link.
    const html =
      entry.pageUrl || io.offline
        ? await io.find(entry.pageUrl ?? '', matchPageFile(match.id))
        : null;
    if (html === null) continue;
    if (channels) match.channels = parseChannels(html);
    if (!events) continue;

    eventPages++;
    const parsed = parseEvents(html, match.homeTeamId, match.awayTeamId);
    // A live feed may lag the score; a finished one must add up, or it is
    // left out and read again next run.
    if (
      parsed &&
      (match.status === 'live' ||
        eventsMatchScore(parsed, match.homeScore, match.awayScore))
    ) {
      match.events = parsed;
    } else if (parsed) {
      console.log(
        `Brasileirão: events of match ${match.id} do not add up to ${match.homeScore}x${match.awayScore}, left out`,
      );
    }
  }
  console.log(
    `Brasileirão: ${eventPages} match pages read for events, ${keptEvents} kept`,
  );

  const matches = rounds
    .map((entry) => entry.match)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const season = page.editionName.match(/\d{4}/)?.[0] ?? String(now);

  return {
    slug: SLUG,
    sport: 'futebol',
    name: NAME,
    season,
    teams: [...knownTeams.values()],
    matches,
    standings,
  };
}
