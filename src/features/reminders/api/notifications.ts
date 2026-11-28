import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Reminder } from '../lib/reminders';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export const NOTIFICATIONS_SUPPORTED = true;

const ANDROID_CHANNEL_ID = 'jogos';

/** Shows reminders even with the app open and creates the Android channel. */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Avisos de jogos',
      importance: Notifications.AndroidImportance.HIGH,
    }).catch((error: unknown) => {
      console.warn('Failed to create the notification channel:', error);
    });
  }
}

function toPermission(
  response: Notifications.NotificationPermissionsStatus,
): NotificationPermission {
  if (response.granted) return 'granted';
  // iOS "provisional" delivers quietly, which is still a yes.
  if (
    response.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return 'granted';
  }
  return response.canAskAgain ? 'undetermined' : 'denied';
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  return toPermission(await Notifications.getPermissionsAsync());
}

/** Shows the system prompt when it still can; otherwise returns the status. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return toPermission(await Notifications.requestPermissionsAsync());
}

/**
 * Android 12+ delays inexact alarms by up to an hour, which would warn after
 * kickoff. Exact alarms need SCHEDULE_EXACT_ALARM, off by default from
 * Android 14. Always true on iOS.
 */
export async function hasExactAlarms(): Promise<boolean> {
  return (await Notifications.getExactAlarmPermissionsAsync()).granted;
}

/** Opens the "Alarms & reminders" system screen; resolves on return. */
export async function requestExactAlarms(): Promise<boolean> {
  return (await Notifications.requestExactAlarmPermissionsAsync()).granted;
}

/** Whether a pending request is exactly this reminder (same text and time). */
function isSameReminder(
  request: Notifications.NotificationRequest,
  reminder: Reminder,
): boolean {
  const { title, body, data } = request.content;
  return (
    title === reminder.title &&
    body === reminder.body &&
    data?.matchId === reminder.matchId &&
    data?.path === reminder.path &&
    data?.fireAt === reminder.fireAt
  );
}

/**
 * Makes the pending list equal to `reminders` (the app schedules nothing
 * else). Only what changed is cancelled or scheduled: cancelling everything
 * and adding up to 60 back one by one left a gap with no reminders, and lost
 * them all if the app was closed in the middle.
 */
export async function replaceScheduledReminders(
  reminders: Reminder[],
): Promise<void> {
  const missing = new Map(reminders.map((reminder) => [reminder.id, reminder]));
  const pending = await Notifications.getAllScheduledNotificationsAsync();

  for (const request of pending) {
    const wanted = missing.get(request.identifier);
    if (wanted && isSameReminder(request, wanted)) {
      missing.delete(request.identifier);
    } else {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
    }
  }

  for (const reminder of missing.values()) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: reminder.title,
        body: reminder.body,
        sound: true,
        // fireAt lets the next run tell an unchanged reminder apart.
        data: {
          matchId: reminder.matchId,
          path: reminder.path,
          fireAt: reminder.fireAt,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.fireAt,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  }
}
