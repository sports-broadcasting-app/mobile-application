import { useEffect, useRef } from 'react';
import { usePathname, useRootNavigationState, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

/** Opens the match of a tapped reminder, also when it launched the app. */
export function NotificationResponder() {
  const router = useRouter();
  const navigationReady = Boolean(useRootNavigationState()?.key);
  const response = Notifications.useLastNotificationResponse();
  // Read when the tap arrives, not a dependency: a route change must not
  // replay the response.
  const currentPath = usePathname();
  const pathname = useRef(currentPath);
  pathname.current = currentPath;

  useEffect(() => {
    if (!navigationReady || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }
    // Cleared first: the response survives restarts until it is consumed.
    Notifications.clearLastNotificationResponse();
    const matchId = response.notification.request.content.data?.matchId;
    if (typeof matchId !== 'string') return;
    // Over another match, swap it: pushing stacked a second detail screen.
    if (pathname.current.startsWith('/match/')) {
      router.replace(`/match/${matchId}`);
    } else {
      router.push(`/match/${matchId}`);
    }
  }, [navigationReady, response, router]);

  return null;
}
