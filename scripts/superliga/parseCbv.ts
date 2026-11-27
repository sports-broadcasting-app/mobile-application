import type {
  CompetitionData,
  CompetitionSlug,
  Match,
  MatchStatus,
  SetScore,
  Standing,
  Team,
} from '../../src/types/snapshot';
import {
  asObject,
  parseJson,
  readBalanced,
  toNumber,
  toText,
  type JsonObject,
} from '../../src/utils/json.ts';

const FLIGHT_CHUNK = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
const MAX_SETS = 5;

/** Joins the Next.js streamed chunks into the text that holds the page data. */
export function extractFlightPayload(html: string): string {
  let payload = '';
  for (const [, chunk] of html.matchAll(FLIGHT_CHUNK)) {
    const text = parseJson(`"${chunk}"`);
    if (typeof text === 'string') payload += text;
  }
  return payload;
}

function parseObjectsStartingWith(
  payload: string,
  prefix: string,
): JsonObject[] {
  const objects: JsonObject[] = [];
  let index = payload.indexOf(prefix);

  while (index !== -1) {
    const raw = readBalanced(payload, index);
    const value = raw ? parseJson(raw) : null;
    if (value !== null) objects.push(asObject(value));
    index = payload.indexOf(prefix, index + prefix.length);
  }
  return objects;
}

function toStatus(raw: JsonObject): MatchStatus {
  if (raw.postponed === true) return 'postponed';
  if (raw.isLive === true) return 'live';
  if (raw.isFinished === true) return 'finished';
  return 'scheduled';
}

function toSetScores(raw: JsonObject): SetScore[] {
  const scores: SetScore[] = [];
  for (let set = 1; set <= MAX_SETS; set++) {
    const home = toNumber(raw[`Set${set}Home`]);
    const away = toNumber(raw[`Set${set}Guest`]);
    if (home === null || away === null || home + away === 0) break;
    scores.push({ home, away });
  }
  return scores;
}

function toChannels(raw: JsonObject): string[] {
  const names = asObject(raw.custom_data).sge_transmission_names;
  return Array.isArray(names)
    ? names.filter((name): name is string => typeof name === 'string')
    : [];
}

function toMatch(raw: JsonObject, competition: CompetitionSlug): Match | null {
  const id = toNumber(raw.ChampionshipMatch_ID);
  const startsAt = toText(raw.MatchDateTime);
  const homeTeamId = toNumber(raw.HomeTeam_ID);
  const awayTeamId = toNumber(raw.GuestTeam_ID);
  if (id === null || !startsAt || homeTeamId === null || awayTeamId === null) {
    return null;
  }

  const status = toStatus(raw);
  const hasResult = status === 'live' || status === 'finished';
  const hall = asObject(raw.hall);

  // Only these fields are published: the source also carries contact e-mails
  // and full rosters, which must never reach the public snapshot.
  return {
    id: String(id),
    competition,
    startsAt,
    round: toNumber(raw.Round_Number),
    roundLabel: toText(raw.RoundType) ?? '',
    homeTeamId: String(homeTeamId),
    awayTeamId: String(awayTeamId),
    status,
    homeScore: hasResult ? toNumber(raw.WonSetHome) : null,
    awayScore: hasResult ? toNumber(raw.WonSetGuest) : null,
    setScores: hasResult ? toSetScores(raw) : [],
    channels: toChannels(raw),
    venue: toText(hall.Denomination),
    city: toText(hall.City),
  };
}

export function parseMatches(
  payload: string,
  competition: CompetitionSlug,
): Match[] {
  const byId = new Map<string, Match>();

  for (const raw of parseObjectsStartingWith(
    payload,
    '{"ChampionshipMatch_ID":',
  )) {
    const match = toMatch(raw, competition);
    if (!match) continue;
    const known = byId.get(match.id);
    if (!known || known.channels.length < match.channels.length) {
      byId.set(match.id, match);
    }
  }

  return [...byId.values()].sort(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
  );
}

export function parseStandings(payload: string): {
  teams: Team[];
  standings: Standing[];
} {
  const rows = parseObjectsStartingWith(payload, '{"teamId":"');
  const seen = new Set<string>();
  const teams: Team[] = [];
  const standings: Standing[] = [];

  for (const raw of rows) {
    const teamId = toText(raw.teamId);
    const name = toText(raw.teamName);
    const position = toNumber(raw.position);
    if (!teamId || !name || position === null || seen.has(teamId)) continue;
    seen.add(teamId);

    teams.push({
      id: teamId,
      name,
      code: toText(raw.teamCode) ?? name.slice(0, 3),
      badgeUrl: toText(raw.badge),
    });
    standings.push({
      teamId,
      position,
      points: toNumber(raw.points) ?? 0,
      matches: toNumber(raw.matches) ?? 0,
      wins: toNumber(raw.wins) ?? 0,
      draws: 0,
      losses: toNumber(raw.losses) ?? 0,
      scoredFor: toNumber(raw.setsWon) ?? 0,
      scoredAgainst: toNumber(raw.setsLost) ?? 0,
    });
  }

  standings.sort((a, b) => a.position - b.position);
  return { teams, standings };
}

export function buildCompetition(
  slug: CompetitionSlug,
  name: string,
  season: string,
  agendaHtml: string,
  standingsHtml: string,
): CompetitionData {
  const matches = parseMatches(extractFlightPayload(agendaHtml), slug);
  const { teams, standings } = parseStandings(
    extractFlightPayload(standingsHtml),
  );
  return {
    slug,
    sport: 'volei',
    name,
    season,
    teams,
    matches: withoutForeignMatches(name, matches, teams),
    standings,
  };
}

/**
 * A game with a club outside the table cannot be shown (the app needs both
 * teams). In Nov 2026 the women's agenda gave one club a new id: its 22 games
 * pointed to a team the standings page did not have, and the Superliga froze.
 * - One unknown id on the agenda and one club of the table with no game:
 *   the same club under two ids, so its games take the table's id.
 * - Otherwise a few games (another event on the page) are left out.
 * - More than that means the page changed: the source is rejected, with the
 *   ids in the message so the run log tells what moved.
 * Every case leaves a `::warning` on the run.
 */
export const MAX_FOREIGN_MATCHES = 3;

export function withoutForeignMatches(
  name: string,
  matches: Match[],
  teams: Team[],
): Match[] {
  const ids = new Set(teams.map((team) => team.id));
  const unknown = new Map<string, number>();
  const used = new Set<string>();
  for (const m of matches) {
    for (const id of [m.homeTeamId, m.awayTeamId]) {
      used.add(id);
      if (!ids.has(id)) unknown.set(id, (unknown.get(id) ?? 0) + 1);
    }
  }
  if (unknown.size === 0) return matches;

  const idle = teams.filter((team) => !used.has(team.id));
  const [only] = unknown;
  const [to] = idle;
  if (unknown.size === 1 && idle.length === 1 && only && to) {
    const [from, count] = only;
    console.log(
      `::warning title=${name}::agenda team ${from} (${count} matches) taken as ${to.name} (${to.id}), the only club of the table without a game`,
    );
    const swap = (id: string) => (id === from ? to.id : id);
    return matches.map((m) => ({
      ...m,
      homeTeamId: swap(m.homeTeamId),
      awayTeamId: swap(m.awayTeamId),
    }));
  }

  const foreign = matches.filter(
    (m) => !ids.has(m.homeTeamId) || !ids.has(m.awayTeamId),
  );
  if (foreign.length > MAX_FOREIGN_MATCHES) {
    const agenda = [...unknown].map(([id, n]) => `${id} (${n})`).join(', ');
    const table = idle.map((t) => `${t.name} (${t.id})`).join(', ') || 'none';
    throw new Error(
      `${name}: ${foreign.length} matches with teams outside the table; agenda ids not in the table: ${agenda}; table clubs without a game: ${table}`,
    );
  }
  for (const m of foreign) {
    const missing = [m.homeTeamId, m.awayTeamId].filter((id) => !ids.has(id));
    console.log(
      `::warning title=${name}::match ${m.id} (${m.startsAt}, ${m.roundLabel}) left out: team ${missing.join(', ')} not in the table`,
    );
  }
  return matches.filter((m) => !foreign.includes(m));
}
