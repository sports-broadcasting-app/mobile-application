const CHAMPIONSHIP_LABELS: Record<string, string> = {
  brasileiro: 'Brasileiro',
  'brasileiro-serie-a': 'Brasileiro Serie A',
  ingles: 'Ingles',
  espanhol: 'Espanhol (La Liga)',
  italiano: 'Italiano (Serie A)',
  alemao: 'Alemao (Bundesliga)',
  frances: 'Frances',
  champions: 'Champions League',
  libertadores: 'Libertadores',
  'copa-do-brasil': 'Copa do Brasil',
  sulamericana: 'Sul-Americana',
  'copa-sudamericana': 'Copa Sul-Americana',
  superliga: 'Superliga Masculina',
  'superliga-masculina': 'Superliga Masculina',
  'superliga-feminina': 'Superliga Feminina',
  'brasileirao-b': 'Brasileiro Serie B',
  'brasileiro-serie-b': 'Brasileiro Serie B',
  formula1: 'Formula 1',
};

export function getChampionshipLabel(slug: string): string {
  return CHAMPIONSHIP_LABELS[slug] ?? slug;
}
