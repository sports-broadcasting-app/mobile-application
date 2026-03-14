import {
  DailySchedule,
  Sport,
  Team,
  StandingsResponse,
  StandingsTable,
} from '../types/match';
import { API_BASE_URL } from '../constants/api';

function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
}

function getLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function fetchTodayMatches(sport?: Sport): Promise<DailySchedule> {
  const date = getLocalDate();
  const query = buildQuery({ sport });
  const response = await fetch(`${API_BASE_URL}/api/matches/${date}${query}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<DailySchedule>;
}

export async function fetchMatchesByDate(
  date: string,
  sport?: Sport,
): Promise<DailySchedule> {
  const query = buildQuery({ sport });
  const response = await fetch(`${API_BASE_URL}/api/matches/${date}${query}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<DailySchedule>;
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
  const query = buildQuery({ sport });
  const response = await fetch(`${API_BASE_URL}/api/teams${query}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<TeamsResponse>;
}

export async function fetchStandings(
  championship?: string,
  sport?: Sport,
): Promise<StandingsTable[]> {
  const query = buildQuery({ championship, sport });
  const response = await fetch(`${API_BASE_URL}/api/standings${query}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = (await response.json()) as StandingsResponse;
  return data.tables;
}

export interface TeamLogosResponse {
  total: number;
  logos: Record<string, string>;
}

export async function fetchTeamLogos(): Promise<Record<string, string>> {
  const response = await fetch(`${API_BASE_URL}/api/team-logos`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = (await response.json()) as TeamLogosResponse;
  return data.logos;
}
