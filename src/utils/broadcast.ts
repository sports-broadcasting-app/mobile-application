/** Where each broadcaster's app opens, matched on the channel name. */
const CHANNEL_URLS: [RegExp, string][] = [
  [/ge tv/, 'https://www.youtube.com/@getv'],
  [/caz[eé]/, 'https://www.youtube.com/@CazeTV'],
  // SporTV, Premiere and TV Globo stream inside Globoplay.
  [/sportv|globo|premiere/, 'https://globoplay.globo.com/'],
  [/prime video/, 'https://www.primevideo.com/'],
  [/disney/, 'https://www.disneyplus.com/'],
  [/record|playplus/, 'https://www.playplus.com/'],
  [/paramount/, 'https://www.paramountplus.com/'],
];

export function getChannelUrl(channel: string): string | null {
  const name = channel.toLowerCase();
  return CHANNEL_URLS.find(([pattern]) => pattern.test(name))?.[1] ?? null;
}
