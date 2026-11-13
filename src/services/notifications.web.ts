import { Reminder } from '../utils/reminders';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

// Browsers cannot schedule local notifications: the web build has no reminders.
export const NOTIFICATIONS_SUPPORTED = false;

export function configureNotifications(): void {}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  return 'denied';
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return 'denied';
}

export async function replaceScheduledReminders(
  _reminders: Reminder[],
): Promise<void> {}
