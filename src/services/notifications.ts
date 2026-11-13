import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Reminder } from '../utils/reminders';

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

/** The app schedules nothing else, so the whole pending list is replaced. */
export async function replaceScheduledReminders(
  reminders: Reminder[],
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const reminder of reminders) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: reminder.title,
        body: reminder.body,
        sound: true,
        data: { matchId: reminder.matchId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.fireAt,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  }
}
