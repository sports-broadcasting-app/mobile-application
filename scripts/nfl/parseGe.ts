import type {
  CompetitionSlug,
  Match,
  MatchStatus,
  Standing,
  Team,
} from '../../src/types/snapshot';
import { toChannels, toInstant } from '../brasileirao/parseGe.ts';

type RawObject = Record<string, unknown>;

/** A game that started this long ago is over, even before ge says so. */
const MATCH_LENGTH_MS = 4 * 60 * 60 * 1000;

/** ge abbreviates a few clubs its own way; fans know the league codes. */
const TEAM_CODES: Record<string, string> = {
  GBP: 'GB',
  KCC: 'KC',
  LVR: 'LV',
  NEP: 'NE',
  NOS: 'NO',
  SF4: 'SF',
  TBB: 'TB',
};

/** Rounds of a phase and whether it is the one being played. */
export interface NflPhase {
  slug: string;
  name: string;
  knockout: boolean;
  actual: boolean;
  rounds: number;
}

/** The slugs the matches service needs, as the standings page names them. */
export interface NflFilter {
  championshipSlug: string;
  championshipEditionSlug: string;
  sportSlug: string;
  modalitySlug: string;
  categorySlug: string;
}

export interface NflPage {
  /** "2026/27" */
  season: string;
  filter: NflFilter;
  phases: NflPhase[];
  teams: Team[];
  standings: Standing[];
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asObject(value: unknown): RawObject {
  return value && typeof value === 'object' ? (value as RawObject) : {};
}

function toTeam(raw: unknown): Team | null {
  const data = asObject(raw);
  const id = toNumber(data.id);
  const name = toText(data.popularName) ?? toText(data.name);
  if (id === null || !name) return null;
  const abbreviation = toText(data.abbreviation) ?? name.slice(0, 3);
  return {
    id: String(id),
    name,
    code: (TEAM_CODES[abbreviation] ?? abbreviation).toUpperCase(),
    badgeUrl: toText(data.badge),
  };
}

/** "NFL 2026/2027" → "2026/27"; a single year stays as it is. */
function toSeason(editionName: string): string {
  const span = editionName.match(/(\d{4})\/(\d{4})/);
  if (span) return `${span[1]}/${span[2].slice(2)}`;
  return editionName.match(/\d{4}/)?.[0] ?? editionName;
}

/** The JSON the standings page embeds for its table component. */
function readPageContext(html: string): RawObject {
  const open = html.indexOf('id="tabela-context"');
  const start = html.indexOf('>', open);
  const end = html.indexOf('</script>', start);
  if (open === -1 || start === -1 || end === -1) {
    throw new Error('Standings page changed: table context not found');
  }
  try {
    return asObject(JSON.parse(html.slice(start + 1, end)));
  } catch {
    throw new Error('Standings page changed: table context is not JSON');
  }
}

/**
 * The standings page carries the phases of the season and the regular
 * season table, one group per division, in the order ge shows them.
 */
export function parseStandingsPage(html: string): NflPage {
  const context = readPageContext(html);
  const data = asObject(
    asObject(asObject(context.getStandingData).body).standings,
  );
  const edition = asObject(data.championshipEdition);
  const filter: NflFilter = {
    championshipSlug: toText(asObject(edition.championship).slug) ?? '',
    championshipEditionSlug: toText(edition.slug) ?? '',
    sportSlug: toText(asObject(data.sport).slug) ?? '',
    modalitySlug: toText(asObject(data.modality).slug) ?? '',
    categorySlug: toText(asObject(data.category).slug) ?? '',
  };
  if (Object.values(filter).some((slug) => slug === '')) {
    throw new Error('Standings page changed: championship slugs not found');
  }

  const phases: NflPhase[] = [];
  const teams: Team[] = [];
  const standings: Standing[] = [];
  const entries = Array.isArray(data.multisportStandings)
    ? (data.multisportStandings as unknown[])
    : [];

  for (const entry of entries.map(asObject)) {
    const phase = asObject(entry.phase);
    const slug = toText(phase.slug);
    const name = toText(phase.name);
    if (!slug || !name) continue;
    const tables = Array.isArray(entry.standing)
      ? (entry.standing as unknown[]).map(asObject)
      : [];
    const knockout = tables.some(
      (table) => table.__typename === 'KnockoutStandingData',
    );
    let rounds = knockout ? 1 : 0;

    for (const table of tables) {
      if (table.__typename !== 'GroupedRoundRobinStandingData') continue;
      rounds = Math.max(rounds, toNumber(table.totalRounds) ?? 0);
      const group = toText(table.name) ?? undefined;
      const ratings = Array.isArray(table.ratings)
        ? (table.ratings as unknown[]).map(asObject)
        : [];
      for (const rating of ratings) {
        const team = toTeam(asObject(rating.contestant).contestantData);
        const position = toNumber(rating.order);
        if (!team || position === null) continue;
        const columns = new Map<string, number>();
        for (const column of (rating.standingColumns as unknown[]) ?? []) {
          const { slug: key, value } = asObject(column);
          const number = toNumber(value);
          if (typeof key === 'string' && number !== null) {
            columns.set(key, number);
          }
        }
        teams.push(team);
        standings.push({
          teamId: team.id,
          position,
          points: 0,
          matches: columns.get('jogos') ?? 0,
          wins: columns.get('vitorias') ?? 0,
          draws: columns.get('empates') ?? 0,
          losses: columns.get('derrotas') ?? 0,
          scoredFor: columns.get('pontos-a-favor') ?? 0,
          scoredAgainst: columns.get('pontos-contra') ?? 0,
          group,
        });
      }
    }

    phases.push({
      slug,
      name,
      knockout,
      actual: phase.actual === true,
      rounds,
    });
  }

  if (phases.length === 0 || standings.length === 0) {
    throw new Error('Standings page changed: no phase with a table');
  }
  return {
    season: toSeason(toText(edition.name) ?? ''),
    filter,
    phases,
    teams,
    standings,
  };
}

function toStatus(moment: string | null, startsAt: string, now: number) {
  if (moment === 'PAST') return 'finished' as MatchStatus;
  const start = Date.parse(startsAt);
  if (now < start) return 'scheduled' as MatchStatus;
  return now < start + MATCH_LENGTH_MS
    ? ('live' as MatchStatus)
    : ('finished' as MatchStatus);
}

/**
 * The games of one round from the ge matches service. `roundLabel` is
 * "Semana 11" in the regular season and the phase name in the playoffs.
 */
export function parseMatches(
  json: string,
  round: { number: number; label: string },
  competition: CompetitionSlug,
  now: number,
): { matches: Match[]; teams: Team[] } {
  const body = asObject(JSON.parse(json));
  const items = asObject(body.data).multisportMatchesByPhase;
  if (!Array.isArray(items)) {
    const errors = Array.isArray(body.errors) ? body.errors : [];
    const message = toText(asObject(errors[0]).message) ?? 'no match list';
    throw new Error(`Round ${round.label}: ${message}`);
  }

  const matches: Match[] = [];
  const teams = new Map<string, Team>();

  for (const item of items.map(asObject)) {
    const raw = asObject(item.match);
    const id = toNumber(raw.id);
    const day = toText(raw.startDate);
    const hour = toText(raw.startHour)?.slice(0, 5);
    const startsAt = day && hour ? toInstant(`${day}T${hour}`) : null;
    const home = toTeam(raw.firstContestant);
    const away = toTeam(raw.secondContestant);
    if (id === null || !startsAt || !home || !away) continue;
    teams.set(home.id, home);
    teams.set(away.id, away);

    const status = toStatus(toText(raw.moment), startsAt, now);
    const hasResult = status !== 'scheduled';
    const score = asObject(raw.scoreboard);
    const location = asObject(raw.location);
    const sources = Array.isArray(raw.liveWatchSources)
      ? (raw.liveWatchSources as unknown[]).map((s) => asObject(s).name)
      : [];

    matches.push({
      id: String(id),
      competition,
      startsAt,
      round: round.number,
      roundLabel: round.label,
      homeTeamId: home.id,
      awayTeamId: away.id,
      status,
      homeScore: hasResult ? toNumber(score.home) : null,
      awayScore: hasResult ? toNumber(score.away) : null,
      setScores: [],
      channels: toChannels(sources),
      venue: toText(location.name),
      // ge's popularName is a stadium nickname ("The Bank"), not a city.
      city: null,
    });
  }

  return { matches, teams: [...teams.values()] };
}
