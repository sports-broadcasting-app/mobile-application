const GE_TV_URL = 'https://www.youtube.com/@getv';
const GLOBOPLAY_URL = 'https://globoplay.globo.com/';

export function getChannelUrl(channel: string): string | null {
  const name = channel.toLowerCase();
  if (name.includes('ge tv')) return GE_TV_URL;
  if (name.includes('sportv') || name.includes('globo')) return GLOBOPLAY_URL;
  return null;
}
