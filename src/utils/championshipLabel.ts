const CHAMPIONSHIP_LABELS: Record<string, string> = {
  brasileiro: 'Brasileiro',
  ingles: 'Ingles',
  espanhol: 'Espanhol (La Liga)',
  italiano: 'Italiano (Serie A)',
  alemao: 'Alemao (Bundesliga)',
  frances: 'Frances',
  champions: 'Champions League',
  libertadores: 'Libertadores',
  'copa-do-brasil': 'Copa do Brasil',
  sulamericana: 'Sul-Americana',
  superliga: 'Superliga Masculina',
  'superliga-feminina': 'Superliga Feminina',
  formula1: 'Formula 1',
  nba: 'NBA',
  nbb: 'NBB',
  ufc: 'UFC',
};

export function getChampionshipLabel(slug: string): string {
  return CHAMPIONSHIP_LABELS[slug] ?? slug;
}
