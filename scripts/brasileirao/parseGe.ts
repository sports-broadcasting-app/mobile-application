import type {
  CompetitionSlug,
  Match,
  MatchEvent,
  MatchEventType,
  MatchStatus,
  Standing,
  Team,
} from '../../src/types/snapshot';
import {
  asObject,
  objectsOf,
  parseJson,
  readBalanced,
  toNumber,
  toText,
  type JsonObject,
} from '../../src/utils/json.ts';

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
  'ge tv': 'GE TV',
};

/** Broadcaster names as the app shows them, promotions dropped, no repeats. */
export function toChannels(names: unknown[]): string[] {
  const channels: string[] = [];
  for (const raw of names) {
    const name = toText(raw)?.trim();
    if (!name || NOT_A_BROADCASTER.has(name.toLowerCase())) continue;
    const channel = CHANNEL_NAMES[name.toLowerCase()] ?? name;
    if (!channels.includes(channel)) channels.push(channel);
  }
  return channels;
}

/** What the collector needs from the championship page. */
export interface TablePage {
  tableId: string;
  phaseSlug: string;
  editionName: string;
  currentRound: number;
  lastRound: number;
}

/** The JSON value that follows `"key":` in a page, or null. */
function readJsonAfter(text: string, key: string): unknown {
  const index = text.indexOf(key);
  if (index === -1) return null;
  const raw = readBalanced(text, index + key.length);
  if (!raw) return null;
  try {
    return parseJson(raw);
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

function toTeam(raw: JsonObject): Team | null {
  const id = toNumber(raw.id);
  const name = toText(raw.nome_popular);
  if (id === null || !name) return null;
  return {
    id: String(id),
    name,
    code: toText(raw.sigla) ?? name.slice(0, 3).toUpperCase(),
    badgeUrl: toText(raw.escudo),
  };
}

function toStatus(
  raw: JsonObject,
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
  const rows = parseJson(json);
  if (!Array.isArray(rows)) throw new Error(`Round ${round}: not a list`);

  const matches: RoundMatch[] = [];
  const teams = new Map<string, Team>();

  for (const raw of objectsOf(rows)) {
    const id = toNumber(raw.id);
    const startsAt = toInstant(toText(raw.data_realizacao) ?? '');
    const sides = asObject(raw.equipes);
    const home = toTeam(asObject(sides.mandante));
    const away = toTeam(asObject(sides.visitante));
    if (id === null || !startsAt || !home || !away) continue;
    teams.set(home.id, home);
    teams.set(away.id, away);

    const transmission = asObject(raw.transmissao);
    const broadcast = asObject(transmission.broadcast);
    const status = toStatus(raw, startsAt, toText(broadcast.id), now);
    const hasResult = status === 'live' || status === 'finished';
    const venue = asObject(raw.sede);

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
        venue: toText(venue.nome_popular),
        city: null,
      },
      pageUrl: toText(transmission.url),
    });
  }

  return { matches, teams: [...teams.values()] };
}

export function parseStandings(json: string): {
  teams: Team[];
  standings: Standing[];
} {
  const body = asObject(parseJson(json));
  const rows = body.classificacao;
  if (!Array.isArray(rows)) throw new Error('Standings: no classification');

  const teams: Team[] = [];
  const standings: Standing[] = [];
  for (const raw of objectsOf(rows)) {
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
  return toChannels(objectsOf(sources).map((source) => source.name));
}

/** ge live-feed kinds that become events; everything else is ignored. */
const EVENT_KINDS: Record<string, MatchEventType> = {
  REGULAR_GOAL: 'goal',
  OWN_GOAL: 'own-goal',
  RED: 'red-card',
};

/** Regular time first, then extra time and penalties; unknown codes last. */
const PERIOD_ORDER: Record<string, number> = {
  '1T': 1,
  '2T': 2,
  '1P': 3,
  '2P': 4,
  PEN: 5,
};

function toSeconds(moment: string): number {
  const [minutes, seconds] = moment.split(':').map(Number);
  return (minutes || 0) * 60 + (seconds || 0);
}

/**
 * Goals and red cards from a ge match page, from the live feed the page
 * embeds (`plays: Array.from([...])`). Only kind, team, player name, period
 * and minute are copied: the posts also carry article text, photos and
 * videos. Null when the page has no feed (yet).
 */
export function parseEvents(
  html: string,
  homeTeamId: string,
  awayTeamId: string,
): MatchEvent[] | null {
  const plays = readJsonAfter(html, 'plays: Array.from(');
  if (!Array.isArray(plays)) return null;

  const seen = new Set<string>();
  const events: (MatchEvent & { order: number })[] = [];
  for (const play of objectsOf(plays)) {
    const details = asObject(play.details);
    const type = EVENT_KINDS[toText(details.kind) ?? ''];
    const id = toText(play.id);
    if (!type || !id || seen.has(id)) continue;
    seen.add(id);

    const teamId = String(asObject(details.team).id ?? '');
    const playerSide =
      teamId === homeTeamId ? 'home' : teamId === awayTeamId ? 'away' : null;
    const player = toText(asObject(details.athlete).popularName);
    const period = toText(asObject(play.period).abbreviation);
    const moment = toText(play.moment);
    if (!playerSide || !player || !period || !moment?.includes(':')) continue;

    // ge files an own goal under the player's team; it counts for the other.
    const side =
      type === 'own-goal'
        ? playerSide === 'home'
          ? 'away'
          : 'home'
        : playerSide;
    const seconds = toSeconds(moment);
    events.push({
      type,
      side,
      player,
      period,
      // Football counts minutes from 1: 00:30 is the 1st minute, 26:29 the 27th.
      minute: Math.floor(seconds / 60) + 1,
      order: (PERIOD_ORDER[period] ?? 9) * 100_000 + seconds,
    });
  }

  return events
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...event }) => event);
}

/** Whether the goals in `events` add up to the final score. */
export function eventsMatchScore(
  events: MatchEvent[],
  homeScore: number | null,
  awayScore: number | null,
): boolean {
  const goals = (side: 'home' | 'away') =>
    events.filter((e) => e.type !== 'red-card' && e.side === side).length;
  return goals('home') === homeScore && goals('away') === awayScore;
}
