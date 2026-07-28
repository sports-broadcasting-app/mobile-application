import { Sport } from '../types/match';

export interface TeamSubscription {
  teamSlug: string;
  sport: Sport;
}

export async function registerSubscriberTeams(
  _pushToken: string,
  _teams: TeamSubscription[],
): Promise<void> {
  return Promise.resolve();
}

export async function unregisterSubscriber(_pushToken: string): Promise<void> {
  return Promise.resolve();
}
