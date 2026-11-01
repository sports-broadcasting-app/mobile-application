import type {
  CompetitionData,
  CompetitionSlug,
  Match,
  MatchStatus,
  SetScore,
  Standing,
  SuperligaSnapshot,
  Team,
} from '../../src/types/superliga';

type RawObject = Record<string, unknown>;

const FLIGHT_CHUNK = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
const MAX_SETS = 5;

/** Joins the Next.js streamed chunks into the text that holds the page data. */
export function extractFlightPayload(html: string): string {
  let payload = '';
  for (const [, chunk] of html.matchAll(FLIGHT_CHUNK)) {
    payload += JSON.parse(`"${chunk}"`) as string;
  }
  return payload;
}

function readBalanced(text: string, start: number): string | null {
  const open = text[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') {
      inString = true;
    } else if (char === open) {
      depth++;
    } else if (char === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function parseObjectsStartingWith(
  payload: string,
  prefix: string,
): RawObject[] {
  const objects: RawObject[] = [];
  let index = payload.indexOf(prefix);

  while (index !== -1) {
    const raw = readBalanced(payload, index);
    if (raw) objects.push(JSON.parse(raw) as RawObject);
    index = payload.indexOf(prefix, index + prefix.length);
  }
  return objects;
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function toStatus(raw: RawObject): MatchStatus {
  if (raw.postponed === true) return 'postponed';
  if (raw.isLive === true) return 'live';
  if (raw.isFinished === true) return 'finished';
  return 'scheduled';
}

function toSetScores(raw: RawObject): SetScore[] {
  const scores: SetScore[] = [];
  for (let set = 1; set <= MAX_SETS; set++) {
    const home = toNumber(raw[`Set${set}Home`]);
    const away = toNumber(raw[`Set${set}Guest`]);
    if (home === null || away === null || home + away === 0) break;
    scores.push({ home, away });
  }
  return scores;
}

function toChannels(raw: RawObject): string[] {
  const customData = raw.custom_data as RawObject | undefined;
  const names = customData?.sge_transmission_names;
  return Array.isArray(names)
    ? names.filter((name): name is string => typeof name === 'string')
    : [];
}

function toMatch(raw: RawObject, competition: CompetitionSlug): Match | null {
  const id = toNumber(raw.ChampionshipMatch_ID);
  const startsAt = toText(raw.MatchDateTime);
  const homeTeamId = toNumber(raw.HomeTeam_ID);
  const awayTeamId = toNumber(raw.GuestTeam_ID);
  if (id === null || !startsAt || homeTeamId === null || awayTeamId === null) {
    return null;
  }

  const status = toStatus(raw);
  const hasResult = status === 'live' || status === 'finished';
  const hall = raw.hall as RawObject | undefined;

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
    homeSets: hasResult ? toNumber(raw.WonSetHome) : null,
    awaySets: hasResult ? toNumber(raw.WonSetGuest) : null,
    setScores: hasResult ? toSetScores(raw) : [],
    channels: toChannels(raw),
    venue: toText(hall?.Denomination),
    city: toText(hall?.City),
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
      losses: toNumber(raw.losses) ?? 0,
      setsWon: toNumber(raw.setsWon) ?? 0,
      setsLost: toNumber(raw.setsLost) ?? 0,
      pointsWon: toNumber(raw.pointsWon) ?? 0,
      pointsLost: toNumber(raw.pointsLost) ?? 0,
    });
  }

  standings.sort((a, b) => a.position - b.position);
  return { teams, standings };
}

export function buildCompetition(
  slug: CompetitionSlug,
  name: string,
  agendaHtml: string,
  standingsHtml: string,
): CompetitionData {
  const matches = parseMatches(extractFlightPayload(agendaHtml), slug);
  const { teams, standings } = parseStandings(
    extractFlightPayload(standingsHtml),
  );
  return { slug, name, teams, matches, standings };
}

/** Throws on a suspicious result so the last good snapshot stays published. */
export function assertValidSnapshot(snapshot: SuperligaSnapshot): void {
  for (const competition of snapshot.competitions) {
    const { name, teams, matches, standings } = competition;
    if (teams.length < 8) {
      throw new Error(`${name}: only ${teams.length} teams found`);
    }
    if (standings.length !== teams.length) {
      throw new Error(`${name}: standings do not match the teams`);
    }
    if (matches.length < teams.length) {
      throw new Error(`${name}: only ${matches.length} matches found`);
    }

    const teamIds = new Set(teams.map((team) => team.id));
    const orphan = matches.find(
      (match) =>
        !teamIds.has(match.homeTeamId) || !teamIds.has(match.awayTeamId),
    );
    if (orphan) throw new Error(`${name}: unknown team in match ${orphan.id}`);

    const invalidDate = matches.find((m) =>
      Number.isNaN(Date.parse(m.startsAt)),
    );
    if (invalidDate) {
      throw new Error(`${name}: invalid date in match ${invalidDate.id}`);
    }
  }
}
