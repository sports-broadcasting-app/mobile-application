import { DailySchedule, Sport } from '../types/match';
import { API_BASE_URL } from '../constants/api';

function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
}

export async function fetchTodayMatches(sport?: Sport): Promise<DailySchedule> {
  const query = buildQuery({ sport });
  const response = await fetch(`${API_BASE_URL}/api/matches/today${query}`);

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
