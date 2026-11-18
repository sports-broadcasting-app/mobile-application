import { normalizeForSearch } from './search';

/**
 * CBV names carry sponsors and come in capitals, and NFL and NBA names carry
 * the city; fans know the short ones.
 */
const SHORT_NAMES: Record<string, string> = {
  // Masculina
  'sada cruzeiro volei': 'Cruzeiro',
  'montes claros volei': 'Montes Claros',
  'volei renata': 'Vôlei Renata',
  'suzano volei': 'Suzano',
  'itambe minas': 'Minas',
  'sesi bauru': 'Sesi Bauru',
  'sil volei guarulhos': 'Guarulhos',
  'praia clube uberlandia volei': 'Praia Clube',
  'saneago goias volei': 'Goiás',
  'azulim/sicoob/monte': 'Monte Carmelo',
  'norde volei': 'Norde',
  'viapol volei sao jose': 'São José',
  // Feminina
  'sesc rj flamengo': 'Sesc Flamengo',
  'sesi volei bauru': 'Sesi Bauru',
  'dentil praia clube': 'Praia Clube',
  'osasco sao cristovao saude': 'Osasco',
  'gerdau minas': 'Minas',
  'fluminense f.c.': 'Fluminense',
  'e.c. pinheiros': 'Pinheiros',
  'brusque volei': 'Brusque',
  'sancor seguros volei': 'Londrina',
  'batavo mackenzie': 'Mackenzie',
  'paulistano barueri': 'Barueri',
  'brasilia volei / brb': 'Brasília',
  // NFL: ge writes the city and the nickname; fans use the nickname.
  'arizona cardinals': 'Cardinals',
  'atlanta falcons': 'Falcons',
  'baltimore ravens': 'Ravens',
  'buffalo bills': 'Bills',
  'carolina panthers': 'Panthers',
  'chicago bears': 'Bears',
  'cincinnati bengals': 'Bengals',
  'cleveland browns': 'Browns',
  'dallas cowboys': 'Cowboys',
  'denver broncos': 'Broncos',
  'detroit lions': 'Lions',
  'green bay packers': 'Packers',
  'houston texans': 'Texans',
  'indianapolis colts': 'Colts',
  'jacksonville jaguars': 'Jaguars',
  'kansas city chiefs': 'Chiefs',
  'las vegas raiders': 'Raiders',
  'los angeles chargers': 'Chargers',
  'los angeles rams': 'Rams',
  'miami dolphins': 'Dolphins',
  'minnesota vikings': 'Vikings',
  'new england patriots': 'Patriots',
  'new orleans saints': 'Saints',
  'new york giants': 'Giants',
  'new york jets': 'Jets',
  'philadelphia eagles': 'Eagles',
  'pittsburgh steelers': 'Steelers',
  'san francisco 49ers': '49ers',
  'seattle seahawks': 'Seahawks',
  'tampa bay buccaneers': 'Buccaneers',
  'tennessee titans': 'Titans',
  'washington commanders': 'Commanders',
  // NBA: same as the NFL.
  'atlanta hawks': 'Hawks',
  'boston celtics': 'Celtics',
  'brooklyn nets': 'Nets',
  'charlotte hornets': 'Hornets',
  'chicago bulls': 'Bulls',
  'cleveland cavaliers': 'Cavaliers',
  'dallas mavericks': 'Mavericks',
  'denver nuggets': 'Nuggets',
  'detroit pistons': 'Pistons',
  'golden state warriors': 'Warriors',
  'houston rockets': 'Rockets',
  'indiana pacers': 'Pacers',
  'los angeles clippers': 'Clippers',
  'los angeles lakers': 'Lakers',
  'memphis grizzlies': 'Grizzlies',
  'miami heat': 'Heat',
  'milwaukee bucks': 'Bucks',
  'minnesota timberwolves': 'Timberwolves',
  'new orleans pelicans': 'Pelicans',
  'new york knicks': 'Knicks',
  'oklahoma city thunder': 'Thunder',
  'orlando magic': 'Magic',
  'philadelphia 76ers': '76ers',
  'phoenix suns': 'Suns',
  'portland trail blazers': 'Trail Blazers',
  'sacramento kings': 'Kings',
  'san antonio spurs': 'Spurs',
  'toronto raptors': 'Raptors',
  'utah jazz': 'Jazz',
  'washington wizards': 'Wizards',
};

const LOWERCASE_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
const UPPERCASE_WORDS = new Set(['rj', 'sp', 'brb', 'fc', 'ec', 'sc']);

function toKey(name: string): string {
  return normalizeForSearch(name).replace(/\s+/g, ' ');
}

function formatWord(word: string, index: number): string {
  const lower = word.toLowerCase();
  if (word.includes('.') || /\d/.test(word) || UPPERCASE_WORDS.has(lower)) {
    return word.toUpperCase();
  }
  if (index > 0 && LOWERCASE_WORDS.has(lower)) return lower;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * The name to show for a club: its short name when known, otherwise the name
 * out of all capitals ("E.C. PINHEIROS" → "E.C. Pinheiros"). Names already in
 * mixed case are kept, so "LOVB Madison (EUA)" stays as written.
 */
export function getTeamName(name: string): string {
  const short = SHORT_NAMES[toKey(name)];
  if (short) return short;
  if (/[a-zà-ÿ]/.test(name)) return name.trim();
  return name
    .trim()
    .split(/\s+/)
    .map((word, index) =>
      word
        .split('/')
        .map((part) => formatWord(part, index))
        .join('/'),
    )
    .join(' ');
}

/** Full and short names together, so a search finds either. */
export function teamSearchText(name: string, code = ''): string {
  return `${name} ${getTeamName(name)} ${code}`;
}
