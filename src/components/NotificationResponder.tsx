import { useEffect } from 'react';
import { useRootNavigationState, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

/** Opens the match of a tapped reminder, also when it launched the app. */
export function NotificationResponder() {
  const router = useRouter();
  const navigationReady = Boolean(useRootNavigationState()?.key);
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!navigationReady || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }
    // Cleared first: the response survives restarts until it is consumed.
    Notifications.clearLastNotificationResponse();
    const matchId = response.notification.request.content.data?.matchId;
    if (typeof matchId === 'string') router.push(`/match/${matchId}`);
  }, [navigationReady, response, router]);

  return null;
}
