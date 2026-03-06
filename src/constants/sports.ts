import { Sport } from '../types/match';

export interface SportMeta {
  sport: Sport;
  label: string;
  icon: 'soccer' | 'volleyball' | 'flag-checkered';
}

export const SPORTS: SportMeta[] = [
  { sport: 'football', label: 'Futebol', icon: 'soccer' },
  { sport: 'volleyball', label: 'Volei', icon: 'volleyball' },
  { sport: 'formula1', label: 'Formula 1', icon: 'flag-checkered' },
];
