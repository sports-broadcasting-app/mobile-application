import type {
  CompetitionData,
  CompetitionSlug,
  Match,
  Sport,
} from '../../src/shared/api/snapshot';
import type { SourceIO } from '../source.ts';
import { anyInLiveWindow } from '../schedule.ts';
import {
  parseMatches,
  parseStandingsPage,
  type GeFilter,
  type GePhase,
  type TeamCodes,
} from './parseGe.ts';

/** One league on the ge multisport pages. */
export interface MultisportLeague {
  slug: CompetitionSlug;
  sport: Sport;
  name: string;
  /** The standings page, which embeds the phases and the table. */
  pageUrl: string;
  codes: TeamCodes;
  matchLengthMs: number;
  /** What the match cards show for a round. */
  roundLabel: (phase: GePhase, round: number) => string;
  /**
   * Rounds a knockout phase can have: 1 for single games (NFL), up to 7 for
   * best-of-seven series (NBA). Rounds after the first that come back empty
   * or with an error end the phase.
   */
  knockoutRounds: number;
}

/** The service the standings page itself queries for each round. */
const GRAPHQL_URL = 'https://geql.globo.com/graphql';
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
/** Settled: every game finished and the last one this long ago. */
const SETTLED_AFTER_MS = 36 * HOUR_MS;
/** Broadcasters are announced days before; rounds further out can wait. */
const LOOKAHEAD_MS = 10 * DAY_MS;
/**
 * Every round is fetched again once the last full pass is this old. Under a
 * day so the 06:00 full run (once a day, give or take GitHub's start delay)
 * always does it; live runs never do.
 */
const FULL_REFRESH_EVERY_MS = 20 * HOUR_MS;

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

/**
 * Playoff phases exist on the page before they are played; the service
 * answers them with an error. A knockout phase is asked for once the season
 * reached it: it is the current one or comes before the current one.
 */
function isPlayable(phase: GePhase, phases: GePhase[]): boolean {
  if (!phase.knockout) return true;
  const current = phases.findIndex((p) => p.actual);
  return current !== -1 && phases.indexOf(phase) <= current;
}

/** The GraphQL query of one round, as the ge page asks it. */
function roundQuery(filter: GeFilter, phase: GePhase, round: number) {
  return {
    operationName: 'GetMultisportMatchesByPhase',
    variables: {
      multisportMatchesByPhaseFilter: {
        ...filter,
        phaseSlug: phase.slug,
        round,
      },
    },
    query: MATCHES_QUERY,
  };
}

const roundKey = (label: string, round: number | null) => `${label}#${round}`;

/**
 * Whether a round can be taken from the published file instead of asked
 * again: it is settled in the past, or still far enough ahead that no
 * broadcaster has been announced. Everything around today is always asked.
 */
export function canReuse(games: Match[], now: number): boolean {
  if (games.length === 0) return false;
  const starts = games.map((m) => Date.parse(m.startsAt));
  const settled =
    games.every((m) => m.status === 'finished') &&
    Math.max(...starts) < now - SETTLED_AFTER_MS;
  return settled || Math.min(...starts) > now + LOOKAHEAD_MS;
}

/**
 * Whether this run asks for every round. Based on the age of the last full
 * pass, not on the clock: GitHub delays scheduled runs by hours, so a fixed
 * hour could be skipped for days. No previous data, or data from before this
 * field existed, means a full pass.
 */
export function needsFullRefresh(
  previous: CompetitionData | undefined,
  now: number,
): boolean {
  const last = previous?.fullRefreshAt
    ? Date.parse(previous.fullRefreshAt)
    : NaN;
  return Number.isNaN(last) || now - last >= FULL_REFRESH_EVERY_MS;
}

/**
 * A league from ge. With `previous` (the published data of this league) it
 * only asks for the rounds around today and keeps the others, which matters
 * for the NBA: one round per game day, over 150 a season. Offline, reads
 * `{slug}-classificacao.html` and the optional
 * `{slug}-{phase}-rodada-{n}.json` files.
 */
export async function collectMultisport(
  league: MultisportLeague,
  io: SourceIO,
  now = Date.now(),
  previous?: CompetitionData,
  { live = false }: { live?: boolean } = {},
): Promise<CompetitionData> {
  // Live run: only the rounds with a game in its window; never a full pass.
  const liveRun = live && previous !== undefined && !io.offline;
  const { slug, codes, matchLengthMs } = league;
  const pageHtml = await io.get(league.pageUrl, `${slug}-classificacao.html`);
  const page = parseStandingsPage(pageHtml, codes);
  const knownTeams = new Map(page.teams.map((team) => [team.id, team]));

  const full = !liveRun && (io.offline || needsFullRefresh(previous, now));
  const reusable = new Map<string, Match[]>();
  if (previous && !full) {
    for (const match of previous.matches) {
      const key = roundKey(match.roundLabel, match.round);
      reusable.set(key, [...(reusable.get(key) ?? []), match]);
    }
  }

  const reused = new Map<string, Match>();
  const fetched = new Map<string, Match>();
  let asked = 0;
  let kept = 0;

  for (const phase of page.phases) {
    if (!isPlayable(phase, page.phases)) continue;
    const rounds = phase.knockout ? league.knockoutRounds : phase.rounds;

    for (let round = 1; round <= rounds; round++) {
      const label = league.roundLabel(phase, round);
      const old = reusable.get(roundKey(label, round)) ?? [];
      const keepForLive = liveRun && !anyInLiveWindow(old, league.sport, now);
      if (keepForLive && old.length === 0) continue;
      if (keepForLive || canReuse(old, now)) {
        for (const match of old) reused.set(match.id, match);
        kept++;
        continue;
      }

      const file = `${slug}-${phase.slug}-rodada-${round}.json`;
      let parsed: Match[];
      try {
        const json = await io.post(
          GRAPHQL_URL,
          roundQuery(page.filter, phase, round),
          file,
        );
        if (json === null) continue;
        asked++;
        parsed = parseMatches(json, { number: round, label }, slug, now, {
          codes,
          matchLengthMs,
        }).matches;
      } catch (error) {
        // A series that ended early has no game 5, 6 or 7.
        if (phase.knockout && round > 1) break;
        throw error;
      }
      if (phase.knockout && round > 1 && parsed.length === 0) break;
      for (const match of parsed) fetched.set(match.id, match);
    }
  }

  // A fetched game wins over a kept one: it may have moved to another round.
  const byId = new Map([...reused, ...fetched]);
  // Exhibitions (All-Star, Pro Bowl) bring teams outside the table.
  const matches = [...byId.values()]
    .filter((m) => knownTeams.has(m.homeTeamId) && knownTeams.has(m.awayTeamId))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  console.log(
    `${league.name}: ${asked} rounds asked, ${kept} kept${full ? ' (full refresh)' : ''}`,
  );

  return {
    slug,
    sport: league.sport,
    name: league.name,
    season: page.season,
    teams: [...knownTeams.values()],
    matches,
    standings: page.standings,
    ...(full
      ? { fullRefreshAt: new Date(now).toISOString() }
      : previous?.fullRefreshAt
        ? { fullRefreshAt: previous.fullRefreshAt }
        : {}),
  };
}
