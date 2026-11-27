import * as Linking from 'expo-linking';
import { getChannelUrl } from './broadcast';

/** Opens a link outside the app; a failure (no browser, no app) is ignored. */
export function openLink(url: string): void {
  Promise.resolve(Linking.openURL(url)).catch(() => {});
}

/** Opens the app or site of a broadcaster; false when it has none. */
export function openChannel(channel: string): boolean {
  const url = getChannelUrl(channel);
  if (url) openLink(url);
  return url !== null;
}
