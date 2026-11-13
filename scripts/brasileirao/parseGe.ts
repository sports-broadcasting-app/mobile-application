import type {
  CompetitionSlug,
  Match,
  MatchStatus,
  Standing,
  Team,
} from '../../src/types/snapshot';

type RawObject = Record<string, unknown>;

const TIME_ZONE = 'America/Sao_Paulo';
/** A match that started this long ago is over, even before ge says so. */
const MATCH_LENGTH_MS = 3 * 60 * 60 * 1000;

/** Promotions ge lists next to the broadcasters. */
const NOT_A_BROADCASTER = new Set(['cartola']);
/** ge writes some brands in lowercase or with an accent. */
const CHANNEL_NAMES: Record<string, string> = {
  globoplay: 'Globoplay',
  sportv: 'SporTV',
  globo: 'TV Globo',
  'prime vídeo': 'Prime Video',
};

/** What the collector needs from the championship page. */
export interface TablePage {
  tableId: string;
  phaseSlug: string;
  editionName: string;
  currentRound: number;
  lastRound: number;
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
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

/** The JSON value that follows `"key":` in a page, or null. */
function readJsonAfter(text: string, key: string): unknown {
  const index = text.indexOf(key);
  if (index === -1) return null;
  const raw = readBalanced(text, index + key.length);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/**
 * ge gives Brasília wall-clock time without an offset. Returns the instant
 * with the offset São Paulo had at that moment, so the app never has to
 * guess ("2026-11-14T18:30" → "2026-11-14T18:30:00-03:00").
 */
export function toInstant(localDateTime: string): string | null {
  const match = localDateTime.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!match) return null;
  const [, day, time] = match;
  const guess = new Date(`${day}T${time}:00Z`);
  if (Number.isNaN(guess.getTime())) return null;

  const zone = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    timeZoneName: 'longOffset',
  })
    .formatToParts(guess)
    .find((part) => part.type === 'timeZoneName')?.value;
  const offset = !zone || zone === 'GMT' ? '+00:00' : zone.slice(3);
  return `${day}T${time}:00${offset}`;
}

/** The ids the championship page carries for the public table service. */
export function parseTablePage(html: string): TablePage {
  const tableId = html.match(/tUUID:\s*"([0-9a-f-]+)"/)?.[1];
  const phaseSlug = html.match(/const fase = \{[^\n]*?"slug":"([^"]+)"/)?.[1];
  const editionName = html.match(/"edicao":\{[^}]*?"nome":"([^"]+)"/)?.[1];
  const rounds = html.match(/"rodada":\{"atual":(\d+),"ultima":(\d+)\}/);
  if (!tableId || !phaseSlug || !rounds) {
    throw new Error('Championship page changed: table ids not found');
  }
  return {
    tableId,
    phaseSlug,
    editionName: editionName ? JSON.parse(`"${editionName}"`) : '',
    currentRound: Number(rounds[1]),
    lastRound: Number(rounds[2]),
  };
}

function toTeam(raw: RawObject | undefined): Team | null {
  const id = toNumber(raw?.id);
  const name = toText(raw?.nome_popular);
  if (id === null || !name) return null;
  return {
    id: String(id),
    name,
    code: toText(raw?.sigla) ?? name.slice(0, 3).toUpperCase(),
    badgeUrl: toText(raw?.escudo),
  };
}

function toStatus(
  raw: RawObject,
  startsAt: string,
  broadcastId: string | null,
  now: number,
): MatchStatus {
  const started = raw.jogo_ja_comecou === true;
  if (broadcastId === 'ENCERRADA') return 'finished';
  if (started && Date.parse(startsAt) + MATCH_LENGTH_MS < now) {
    return 'finished';
  }
  return started ? 'live' : 'scheduled';
}

/** A match from the round service, with the ge page it links to. */
export interface RoundMatch {
  match: Match;
  pageUrl: string | null;
}

export function parseRound(
  json: string,
  round: number,
  competition: CompetitionSlug,
  now: number,
): { matches: RoundMatch[]; teams: Team[] } {
  const rows = JSON.parse(json) as unknown;
  if (!Array.isArray(rows)) throw new Error(`Round ${round}: not a list`);

  const matches: RoundMatch[] = [];
  const teams = new Map<string, Team>();

  for (const raw of rows as RawObject[]) {
    const id = toNumber(raw.id);
    const startsAt = toInstant(toText(raw.data_realizacao) ?? '');
    const sides = raw.equipes as RawObject | undefined;
    const home = toTeam(sides?.mandante as RawObject | undefined);
    const away = toTeam(sides?.visitante as RawObject | undefined);
    if (id === null || !startsAt || !home || !away) continue;
    teams.set(home.id, home);
    teams.set(away.id, away);

    const transmission = raw.transmissao as RawObject | null | undefined;
    const broadcast = transmission?.broadcast as RawObject | undefined;
    const status = toStatus(raw, startsAt, toText(broadcast?.id), now);
    const hasResult = status === 'live' || status === 'finished';
    const venue = raw.sede as RawObject | undefined;

    matches.push({
      match: {
        id: String(id),
        competition,
        startsAt,
        round,
        roundLabel: `${round}ª rodada`,
        homeTeamId: home.id,
        awayTeamId: away.id,
        status,
        homeScore: hasResult ? toNumber(raw.placar_oficial_mandante) : null,
        awayScore: hasResult ? toNumber(raw.placar_oficial_visitante) : null,
        setScores: [],
        channels: [],
        venue: toText(venue?.nome_popular),
        city: null,
      },
      pageUrl: toText(transmission?.url),
    });
  }

  return { matches, teams: [...teams.values()] };
}

export function parseStandings(json: string): {
  teams: Team[];
  standings: Standing[];
} {
  const body = JSON.parse(json) as RawObject;
  const rows = body.classificacao;
  if (!Array.isArray(rows)) throw new Error('Standings: no classification');

  const teams: Team[] = [];
  const standings: Standing[] = [];
  for (const raw of rows as RawObject[]) {
    const team = toTeam({ ...raw, id: raw.equipe_id });
    const position = toNumber(raw.ordem);
    if (!team || position === null) continue;
    teams.push(team);
    standings.push({
      teamId: team.id,
      position,
      points: toNumber(raw.pontos) ?? 0,
      matches: toNumber(raw.jogos) ?? 0,
      wins: toNumber(raw.vitorias) ?? 0,
      draws: toNumber(raw.empates) ?? 0,
      losses: toNumber(raw.derrotas) ?? 0,
      scoredFor: toNumber(raw.gols_pro) ?? 0,
      scoredAgainst: toNumber(raw.gols_contra) ?? 0,
    });
  }
  standings.sort((a, b) => a.position - b.position);
  return { teams, standings };
}

/**
 * The broadcasters a ge match page lists under "Onde assistir". Only their
 * names are kept: the page also carries subscription links and promotions.
 */
export function parseChannels(html: string): string[] {
  const sources = readJsonAfter(html, '"liveWatchSources":');
  if (!Array.isArray(sources)) return [];

  const channels: string[] = [];
  for (const source of sources as RawObject[]) {
    const name = toText(source.name)?.trim();
    if (!name || NOT_A_BROADCASTER.has(name.toLowerCase())) continue;
    const channel = CHANNEL_NAMES[name.toLowerCase()] ?? name;
    if (!channels.includes(channel)) channels.push(channel);
  }
  return channels;
}
