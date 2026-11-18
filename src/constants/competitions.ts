import { CompetitionSlug, Sport, Standing } from '../types/snapshot';

export interface CompetitionInfo {
  slug: CompetitionSlug;
  sport: Sport;
  /** Full name, for titles. */
  name: string;
  /** Short name, for filter chips and match cards. */
  label: string;
}

/** Every competition the app knows, in display order. */
export const COMPETITIONS: CompetitionInfo[] = [
  {
    slug: 'masculina',
    sport: 'volei',
    name: 'Superliga Masculina',
    label: 'Superliga M',
  },
  {
    slug: 'feminina',
    sport: 'volei',
    name: 'Superliga Feminina',
    label: 'Superliga F',
  },
  {
    slug: 'serie-a',
    sport: 'futebol',
    name: 'Brasileirão Série A',
    label: 'Brasileirão',
  },
  {
    slug: 'nfl',
    sport: 'futebol-americano',
    name: 'NFL',
    label: 'NFL',
  },
  {
    slug: 'nba',
    sport: 'basquete',
    name: 'NBA',
    label: 'NBA',
  },
];

/** Sport names, in the order the pickers group them. Icons: SportIcon. */
export const SPORTS: { sport: Sport; name: string }[] = [
  { sport: 'basquete', name: 'Basquete' },
  { sport: 'futebol', name: 'Futebol' },
  { sport: 'futebol-americano', name: 'Futebol americano' },
  { sport: 'volei', name: 'Vôlei' },
];

export function getSport(sport: Sport) {
  return SPORTS.find((entry) => entry.sport === sport) ?? SPORTS[0];
}

export const ALL_COMPETITIONS: CompetitionSlug[] = COMPETITIONS.map(
  (info) => info.slug,
);

const BY_SLUG = new Map(COMPETITIONS.map((info) => [info.slug, info]));

export function isCompetitionSlug(value: unknown): value is CompetitionSlug {
  return typeof value === 'string' && BY_SLUG.has(value as CompetitionSlug);
}

export function getCompetition(slug: CompetitionSlug): CompetitionInfo {
  const info = BY_SLUG.get(slug);
  if (!info) throw new Error(`Unknown competition: ${slug}`);
  return info;
}

/** Chip options for the competition filters. */
export const COMPETITION_OPTIONS = COMPETITIONS.map(({ slug, label }) => ({
  value: slug,
  label,
}));

export interface StandingsColumn {
  code: string;
  label: string;
  value: (standing: Standing) => number;
}

/** The standings columns of each sport, with the legend text. */
export const STANDINGS_COLUMNS: Record<Sport, StandingsColumn[]> = {
  volei: [
    { code: 'P', label: 'Pontos', value: (s) => s.points },
    { code: 'J', label: 'Jogos', value: (s) => s.matches },
    { code: 'V', label: 'Vitórias', value: (s) => s.wins },
    { code: 'D', label: 'Derrotas', value: (s) => s.losses },
    { code: 'SV', label: 'Sets vencidos', value: (s) => s.scoredFor },
    { code: 'SP', label: 'Sets perdidos', value: (s) => s.scoredAgainst },
  ],
  futebol: [
    { code: 'P', label: 'Pontos', value: (s) => s.points },
    { code: 'J', label: 'Jogos', value: (s) => s.matches },
    { code: 'V', label: 'Vitórias', value: (s) => s.wins },
    { code: 'E', label: 'Empates', value: (s) => s.draws },
    { code: 'D', label: 'Derrotas', value: (s) => s.losses },
    {
      code: 'SG',
      label: 'Saldo de gols',
      value: (s) => s.scoredFor - s.scoredAgainst,
    },
  ],
  'futebol-americano': [
    { code: 'V', label: 'Vitórias', value: (s) => s.wins },
    { code: 'D', label: 'Derrotas', value: (s) => s.losses },
    { code: 'E', label: 'Empates', value: (s) => s.draws },
    { code: 'PF', label: 'Pontos a favor', value: (s) => s.scoredFor },
    { code: 'PC', label: 'Pontos contra', value: (s) => s.scoredAgainst },
    {
      code: 'DIF',
      label: 'Diferença de pontos',
      value: (s) => s.scoredFor - s.scoredAgainst,
    },
  ],
  // The league's own table: no draws, ranked by winning percentage. Season
  // points run into four digits, too wide for the columns, so only the
  // difference is shown.
  basquete: [
    { code: 'V', label: 'Vitórias', value: (s) => s.wins },
    { code: 'D', label: 'Derrotas', value: (s) => s.losses },
    {
      code: '%',
      label: 'Aproveitamento',
      value: (s) =>
        s.matches > 0 ? Math.round((100 * s.wins) / s.matches) : 0,
    },
    {
      code: 'DIF',
      label: 'Diferença de pontos',
      value: (s) => s.scoredFor - s.scoredAgainst,
    },
  ],
};
