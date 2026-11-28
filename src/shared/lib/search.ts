const ACCENTS: [RegExp, string][] = [
  [/[áàâãä]/g, 'a'],
  [/[éèêë]/g, 'e'],
  [/[íìîï]/g, 'i'],
  [/[óòôõö]/g, 'o'],
  [/[úùûü]/g, 'u'],
  [/ç/g, 'c'],
];

/** Lowercase without accents, so "volei" finds "VÔLEI". */
export function normalizeForSearch(text: string): string {
  return ACCENTS.reduce(
    (result, [pattern, letter]) => result.replace(pattern, letter),
    text.toLowerCase().trim(),
  );
}
