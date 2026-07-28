import {
  Bracket,
  DailySchedule,
  Sport,
  Team,
  StandingsTable,
} from '../types/match';
import { USE_SUPABASE_DATA } from '../constants/api';
import {
  getLocalBrackets,
  getLocalSchedule,
  getLocalTeamLogos,
  getLocalTeams,
  localStandings,
} from '../data/localSportsData';
import { getStoredStandings, seedStandingsIfEmpty } from './standingsStore';
import {
  fetchSupabaseSchedule,
  fetchSupabaseStandings,
  fetchSupabaseTeamLogos,
  fetchSupabaseTeams,
} from './supabaseSportsService';

function getLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function fetchTodayMatches(sport?: Sport): Promise<DailySchedule> {
  const date = getLocalDate();
  if (USE_SUPABASE_DATA) {
    return fetchSupabaseSchedule(date, sport);
  }

  return getLocalSchedule(date, sport);
}

export async function fetchMatchesByDate(
  date: string,
  sport?: Sport,
): Promise<DailySchedule> {
  if (USE_SUPABASE_DATA) {
    return fetchSupabaseSchedule(date, sport);
  }

  return getLocalSchedule(date, sport);
}

export interface League {
  sport: Sport;
  championship: string;
  teams: Team[];
}

export interface TeamsResponse {
  leagues: League[];
}

export async function fetchTeams(sport?: Sport): Promise<TeamsResponse> {
  if (USE_SUPABASE_DATA) {
    return fetchSupabaseTeams(sport);
  }

  return getLocalTeams(sport);
}

export async function fetchStandings(
  championship?: string,
  sport?: Sport,
): Promise<StandingsTable[]> {
  if (USE_SUPABASE_DATA) {
    return fetchSupabaseStandings(championship, sport);
  }

  await seedStandingsIfEmpty(localStandings);
  return getStoredStandings(championship, sport);
}

export interface TeamLogosResponse {
  total: number;
  logos: Record<string, string>;
}

export async function fetchBrackets(
  championship?: string,
  sport?: Sport,
): Promise<Bracket[]> {
  return getLocalBrackets(championship, sport);
}

export async function fetchTeamLogos(): Promise<Record<string, string>> {
  if (USE_SUPABASE_DATA) {
    return fetchSupabaseTeamLogos();
  }

  return getLocalTeamLogos();
}
