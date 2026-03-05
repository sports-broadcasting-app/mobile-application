export interface BroadcasterBrand {
  initials: string;
  backgroundColor: string;
  textColor: string;
}

const BROADCASTER_BRANDS: Record<string, BroadcasterBrand> = {
  Globo: { initials: 'G', backgroundColor: '#1a1a2e', textColor: '#fff' },
  SporTV: { initials: 'ST', backgroundColor: '#00a651', textColor: '#fff' },
  'SporTV 2': { initials: 'S2', backgroundColor: '#00a651', textColor: '#fff' },
  'SporTV 3': { initials: 'S3', backgroundColor: '#00a651', textColor: '#fff' },
  Premiere: { initials: 'PR', backgroundColor: '#e87e04', textColor: '#fff' },
  ESPN: { initials: 'E', backgroundColor: '#cc0000', textColor: '#fff' },
  ESPN2: { initials: 'E2', backgroundColor: '#cc0000', textColor: '#fff' },
  'ESPN 3': { initials: 'E3', backgroundColor: '#cc0000', textColor: '#fff' },
  ESPN4: { initials: 'E4', backgroundColor: '#cc0000', textColor: '#fff' },
  'ESPN 4': { initials: 'E4', backgroundColor: '#cc0000', textColor: '#fff' },
  'Disney+': { initials: 'D+', backgroundColor: '#113ccf', textColor: '#fff' },
  Band: { initials: 'B', backgroundColor: '#0057a8', textColor: '#fff' },
  BandSports: {
    initials: 'BS',
    backgroundColor: '#0057a8',
    textColor: '#fff',
  },
  CazéTV: { initials: 'CZ', backgroundColor: '#6b21a8', textColor: '#fff' },
  'Cazé TV': {
    initials: 'CZ',
    backgroundColor: '#6b21a8',
    textColor: '#fff',
  },
  CazeTV: { initials: 'CZ', backgroundColor: '#6b21a8', textColor: '#fff' },
  DAZN: { initials: 'DZ', backgroundColor: '#0c0c0c', textColor: '#f5f5f5' },
  TNT: { initials: 'TN', backgroundColor: '#d4001a', textColor: '#fff' },
  'TNT Sports': {
    initials: 'TN',
    backgroundColor: '#d4001a',
    textColor: '#fff',
  },
  Record: { initials: 'R', backgroundColor: '#1e3a8a', textColor: '#fff' },
  'Amazon Prime Video': {
    initials: 'AP',
    backgroundColor: '#00a8e1',
    textColor: '#fff',
  },
  'Paramount+': {
    initials: 'P+',
    backgroundColor: '#0064ff',
    textColor: '#fff',
  },
  GOAT: { initials: 'GT', backgroundColor: '#1a1a2e', textColor: '#f5f5f5' },
  'Canal GOAT': {
    initials: 'GT',
    backgroundColor: '#1a1a2e',
    textColor: '#f5f5f5',
  },
  RedeTV: { initials: 'RT', backgroundColor: '#e31937', textColor: '#fff' },
  'TV Brasil': {
    initials: 'TB',
    backgroundColor: '#006633',
    textColor: '#fff',
  },
  NSports: { initials: 'NS', backgroundColor: '#ff6600', textColor: '#fff' },
  Xsports: { initials: 'XS', backgroundColor: '#1a1a2e', textColor: '#fff' },
  OneFootball: {
    initials: 'OF',
    backgroundColor: '#ea1845',
    textColor: '#fff',
  },
  'VBTV Superliga': {
    initials: 'VB',
    backgroundColor: '#1a3c6e',
    textColor: '#fff',
  },
};

export function getBroadcasterBrand(name: string): BroadcasterBrand | null {
  return BROADCASTER_BRANDS[name] ?? null;
}
