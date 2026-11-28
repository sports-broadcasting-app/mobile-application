import * as Linking from 'expo-linking';

/** Opens a link outside the app; a failure (no browser, no app) is ignored. */
export function openLink(url: string): void {
  Promise.resolve(Linking.openURL(url)).catch(() => {});
}
