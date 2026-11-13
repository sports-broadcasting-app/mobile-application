import { normalizeForSearch } from './search';

/** CBV names carry sponsors and come in capitals; fans know the short ones. */
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
