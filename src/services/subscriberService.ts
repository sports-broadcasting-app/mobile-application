import { API_BASE_URL } from '../constants/api';
import { Sport } from '../types/match';

export interface TeamSubscription {
  teamSlug: string;
  sport: Sport;
}

export async function registerSubscriberTeams(
  pushToken: string,
  teams: TeamSubscription[],
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pushToken, teams }),
  });
  if (!response.ok) {
    throw new Error(`Subscriber registration failed: ${response.status}`);
  }
}

export async function unregisterSubscriber(pushToken: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/subscribers/${encodeURIComponent(pushToken)}`,
    { method: 'DELETE' },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(`Subscriber unregistration failed: ${response.status}`);
  }
}
