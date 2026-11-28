import { openLink } from '@/shared/lib/links';

/** Where each broadcaster's app opens, matched on the channel name. */
const CHANNEL_URLS: [RegExp, string][] = [
  [/ge tv/, 'https://www.youtube.com/@getv'],
  [/caz[eé]/, 'https://www.youtube.com/@CazeTV'],
  // ESPN streams inside Disney+ in Brazil.
  [/espn|disney/, 'https://www.disneyplus.com/'],
  [/netflix/, 'https://www.netflix.com/'],
  // NFL Game Pass is sold through DAZN in Brazil.
  [/game pass|dazn/, 'https://www.dazn.com/'],
  // SporTV, Premiere and TV Globo stream inside Globoplay.
  [/sportv|globo|premiere/, 'https://globoplay.globo.com/'],
  [/prime video/, 'https://www.primevideo.com/'],
  [/record|playplus/, 'https://www.playplus.com/'],
  [/paramount/, 'https://www.paramountplus.com/'],
];

export function getChannelUrl(channel: string): string | null {
  const name = channel.toLowerCase();
  return CHANNEL_URLS.find(([pattern]) => pattern.test(name))?.[1] ?? null;
}

/** Opens the app or site of a broadcaster; false when it has none. */
export function openChannel(channel: string): boolean {
  const url = getChannelUrl(channel);
  if (url) openLink(url);
  return url !== null;
}
