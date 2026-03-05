import { Sport } from '../types/match';

export interface SportMeta {
  sport: Sport;
  label: string;
  icon:
    | 'soccer'
    | 'volleyball'
    | 'basketball'
    | 'boxing-glove'
    | 'flag-checkered';
  enabled: boolean;
}

export const SPORTS: SportMeta[] = [
  { sport: 'football', label: 'Futebol', icon: 'soccer', enabled: true },
  { sport: 'volleyball', label: 'Volei', icon: 'volleyball', enabled: true },
  {
    sport: 'basketball',
    label: 'Basquete',
    icon: 'basketball',
    enabled: false,
  },
  { sport: 'mma', label: 'MMA', icon: 'boxing-glove', enabled: false },
  {
    sport: 'formula1',
    label: 'Formula 1',
    icon: 'flag-checkered',
    enabled: true,
  },
];
