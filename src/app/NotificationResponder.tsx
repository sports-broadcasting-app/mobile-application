import { useEffect, useRef } from 'react';
import { usePathname, useRootNavigationState, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

/** Opens the screen of a tapped reminder, also when it launched the app. */
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
    const data = response.notification.request.content.data;
    // Reminders scheduled before 1.5 carry only the match id.
    const path =
      typeof data?.path === 'string'
        ? data.path
        : typeof data?.matchId === 'string'
          ? `/match/${data.matchId}`
          : null;
    if (!path) return;
    // Over another detail screen, swap it: pushing stacked a second one.
    if (
      pathname.current.startsWith('/match/') ||
      pathname.current.startsWith('/grand-prix/')
    ) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }, [navigationReady, response, router]);

  return null;
}
