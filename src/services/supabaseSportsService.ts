import {
  Broadcast,
  DailySchedule,
  FootballScore,
  Match,
  MatchScore,
  MatchStatus,
  Sport,
  StandingsTable,
  Team,
  VolleyballScore,
} from '../types/match';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../constants/api';

interface SupabaseTeamRow {
  id?: number;
  slug: string;
  name: string;
  acronym?: string | null;
  sport?: Sport | null;
  logo_url?: string | null;
}

interface SupabaseMatchRow {
  id: string;
  sport: Sport;
  championship_slug: string;
  championship_name?: string | null;
  championship_phase?: string | null;
  iso_date: string;
  match_date: string;
  hour?: string | null;
  stadium?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  status?: MatchStatus | null;
  result?: string | null;
  round?: number | null;
  home_team_slug?: string | null;
  away_team_slug?: string | null;
  event_name?: string | null;
  session_type?: string | null;
  session_label?: string | null;
  score?: MatchScore | Record<string, unknown> | null;
  score_url?: string | null;
  crawled_at?: string | null;
}

interface SupabaseBroadcastRow {
  match_id: string;
  name: string;
  url?: string | null;
}

interface SupabaseStandingTableRow {
  id: string;
  sport: Sport;
  championship_slug: string;
  championship_name?: string | null;
  type?: 'league' | 'group' | 'driver' | null;
  group_name?: string | null;
  crawled_at?: string | null;
}

interface SupabaseStandingRow {
  table_id: string;
  position: number;
  team_slug?: string | null;
  team_name?: string | null;
  logo_url?: string | null;
  points?: number | null;
  played?: number | null;
  won?: number | null;
  drawn?: number | null;
  lost?: number | null;
  goals_for?: number | null;
  goals_against?: number | null;
  goal_difference?: number | null;
  sets_won?: number | null;
  sets_lost?: number | null;
  driver?: string | null;
  nationality?: string | null;
  constructor_name?: string | null;
  wins?: number | null;
}

const restBaseUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1`;

function assertConfigured() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase nao configurado no app.');
  }
}

async function supabaseGet<T>(
  table: string,
  params: Record<string, string>,
): Promise<T> {
  assertConfigured();

  const search = new URLSearchParams(params);
  const response = await fetch(`${restBaseUrl}/${table}?${search.toString()}`, {
    headers: {
      Accept: 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Erro ao buscar ${table}: ${response.status} ${body}`);
  }

  return response.json() as Promise<T>;
}

function inFilter(values: string[]): string {
  const escaped = values.map((value) => `"${value.replace(/"/g, '\\"')}"`);
  return `in.(${escaped.join(',')})`;
}

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function teamFromRow(row?: SupabaseTeamRow, fallbackSlug = ''): Team {
  const slug = row?.slug ?? fallbackSlug;
  const name = row?.name ?? slug;

  return {
    id: row?.id ?? Math.abs(hashSlug(slug)),
    name,
    acronym: row?.acronym ?? acronymFromName(name),
    slug,
    logoUrl: row?.logo_url ?? undefined,
  };
}

function hashSlug(slug: string): number {
  return slug.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
}

function acronymFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function defaultScore(sport: Sport): MatchScore {
  if (sport === 'volleyball') {
    return {
      type: 'volleyball',
      sets: { home: null, away: null },
      setScores: [],
    };
  }

  return {
    type: 'football',
    goals: { home: null, away: null },
    penalties: { home: null, away: null },
  };
}

function normalizeScore(row: SupabaseMatchRow): MatchScore {
  const score = row.score;
  if (row.sport === 'volleyball' && score && 'sets' in score) {
    return score as VolleyballScore;
  }
  if (row.sport === 'football' && score && 'goals' in score) {
    return score as FootballScore;
  }
  return defaultScore(row.sport);
}

function mapMatch(
  row: SupabaseMatchRow,
  teamsBySlug: Map<string, SupabaseTeamRow>,
  broadcastsByMatchId: Map<string, Broadcast[]>,
): Match {
  const base = {
    id: row.id,
    championship: {
      id: hashSlug(row.championship_slug),
      slug: row.championship_slug,
      phase: row.championship_phase ?? '',
    },
    isoDate: row.iso_date,
    date: row.match_date,
    hour: row.hour ?? '',
    stadium: row.stadium ?? '',
    location: {
      city: row.city ?? '',
      state: row.state ?? '',
      country: row.country ?? '',
    },
    status: row.status ?? 'match-not-started',
    result: row.result ?? null,
    round: row.round ?? null,
    broadcast: broadcastsByMatchId.get(row.id) ?? [],
    scoreUrl: row.score_url ?? '',
  };

  if (row.sport === 'formula1') {
    return {
      ...base,
      sport: 'formula1',
      eventName: row.event_name ?? row.championship_name ?? 'Formula 1',
      sessionType: row.session_type ?? '',
      sessionLabel: row.session_label ?? '',
    };
  }

  return {
    ...base,
    sport: row.sport,
    homeTeam: teamFromRow(
      teamsBySlug.get(row.home_team_slug ?? ''),
      row.home_team_slug ?? '',
    ),
    awayTeam: teamFromRow(
      teamsBySlug.get(row.away_team_slug ?? ''),
      row.away_team_slug ?? '',
    ),
    score: normalizeScore(row),
  };
}

async function fetchBroadcasts(matchIds: string[]) {
  if (matchIds.length === 0) return new Map<string, Broadcast[]>();

  const rows = await supabaseGet<SupabaseBroadcastRow[]>('broadcasts', {
    select: 'match_id,name,url',
    match_id: inFilter(matchIds),
    order: 'name.asc',
  });

  return rows.reduce((map, row) => {
    const items = map.get(row.match_id) ?? [];
    items.push({ name: row.name, url: row.url ?? '' });
    map.set(row.match_id, items);
    return map;
  }, new Map<string, Broadcast[]>());
}

async function fetchTeamsBySlug(slugs: string[]) {
  if (slugs.length === 0) return new Map<string, SupabaseTeamRow>();

  const rows = await supabaseGet<SupabaseTeamRow[]>('teams', {
    select: '*',
    slug: inFilter(slugs),
  });

  return new Map(rows.map((team) => [team.slug, team]));
}

export async function fetchSupabaseSchedule(
  date: string,
  sport?: Sport,
): Promise<DailySchedule> {
  const params: Record<string, string> = {
    select: '*',
    match_date: `eq.${date}`,
    order: 'iso_date.asc',
  };

  if (sport) {
    params.sport = `eq.${sport}`;
  }

  const matchRows = await supabaseGet<SupabaseMatchRow[]>('matches', params);
  const matchIds = matchRows.map((match) => match.id);
  const teamSlugs = unique(
    matchRows.flatMap((match) => [match.home_team_slug, match.away_team_slug]),
  );

  const [broadcastsByMatchId, teamsBySlug] = await Promise.all([
    fetchBroadcasts(matchIds),
    fetchTeamsBySlug(teamSlugs),
  ]);

  return {
    date,
    crawledAt: matchRows[0]?.crawled_at ?? '',
    matches: matchRows.map((row) =>
      mapMatch(row, teamsBySlug, broadcastsByMatchId),
    ),
  };
}

export interface League {
  sport: Sport;
  championship: string;
  teams: Team[];
}

export interface TeamsResponse {
  leagues: League[];
}

export async function fetchSupabaseTeams(
  sport?: Sport,
): Promise<TeamsResponse> {
  const params: Record<string, string> = {
    select: '*',
    order: 'sport.asc,name.asc',
  };

  if (sport) {
    params.sport = `eq.${sport}`;
  }

  const rows = await supabaseGet<SupabaseTeamRow[]>('teams', params);
  const bySport = rows.reduce((map, row) => {
    const sportName = row.sport ?? 'football';
    const teams = map.get(sportName) ?? [];
    teams.push(teamFromRow(row));
    map.set(sportName, teams);
    return map;
  }, new Map<Sport, Team[]>());

  return {
    leagues: Array.from(bySport.entries()).map(([leagueSport, teams]) => ({
      sport: leagueSport,
      championship: leagueSport,
      teams,
    })),
  };
}

export async function fetchSupabaseStandings(
  championship?: string,
  sport?: Sport,
): Promise<StandingsTable[]> {
  const params: Record<string, string> = {
    select: '*',
    order: 'sport.asc,championship_slug.asc,group_name.asc',
  };

  if (championship) {
    params.championship_slug = `eq.${championship}`;
  }
  if (sport) {
    params.sport = `eq.${sport}`;
  }

  const tableRows = await supabaseGet<SupabaseStandingTableRow[]>(
    'standings_tables',
    params,
  );
  const tableIds = tableRows.map((table) => table.id);

  if (tableIds.length === 0) return [];

  const rowRows = await supabaseGet<SupabaseStandingRow[]>('standings_rows', {
    select: '*',
    table_id: inFilter(tableIds),
    order: 'position.asc',
  });

  const rowsByTableId = rowRows.reduce((map, row) => {
    const rows = map.get(row.table_id) ?? [];
    rows.push(row);
    map.set(row.table_id, rows);
    return map;
  }, new Map<string, SupabaseStandingRow[]>());

  return tableRows.map((table) => ({
    sport: table.sport,
    championship: table.championship_slug,
    championshipName: table.championship_name ?? table.championship_slug,
    type: table.type ?? 'league',
    group: table.group_name ?? undefined,
    crawledAt: table.crawled_at ?? '',
    rows: (rowsByTableId.get(table.id) ?? []).map((row) => ({
      position: row.position,
      team: {
        name: row.team_name ?? row.driver ?? '',
        slug: row.team_slug ?? row.driver ?? '',
        logoUrl: row.logo_url ?? '',
      },
      points: row.points ?? 0,
      played: row.played ?? undefined,
      won: row.won ?? undefined,
      drawn: row.drawn ?? undefined,
      lost: row.lost ?? undefined,
      goalsFor: row.goals_for ?? undefined,
      goalsAgainst: row.goals_against ?? undefined,
      goalDifference: row.goal_difference ?? undefined,
      setsWon: row.sets_won ?? undefined,
      setsLost: row.sets_lost ?? undefined,
      driver: row.driver ?? undefined,
      nationality: row.nationality ?? undefined,
      constructorName: row.constructor_name ?? undefined,
      wins: row.wins ?? undefined,
    })),
  }));
}

export async function fetchSupabaseTeamLogos(): Promise<
  Record<string, string>
> {
  const rows = await supabaseGet<SupabaseTeamRow[]>('teams', {
    select: '*',
  });

  return rows.reduce<Record<string, string>>((logos, row) => {
    if (row.logo_url) logos[row.slug] = row.logo_url;
    return logos;
  }, {});
}
