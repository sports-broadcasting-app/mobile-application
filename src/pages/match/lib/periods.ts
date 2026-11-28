import type { PeriodColumn } from '../ui/PeriodScoreboard';
import type { SetScore } from '@/shared/api/snapshot';

const QUARTERS = 4;

/**
 * Scoreboard columns for basketball: "1º Q" to "4º Q", then overtime as
 * "Pr" (or "Pr 1", "Pr 2" when there was more than one).
 */
export function quarterColumns(periods: SetScore[]): PeriodColumn[] {
  const overtimes = periods.length - QUARTERS;
  return periods.map((period, index) => {
    if (index < QUARTERS) {
      return {
        label: `${index + 1}º Q`,
        name: `${index + 1}º quarto`,
        ...period,
      };
    }
    const n = index - QUARTERS + 1;
    return {
      label: overtimes > 1 ? `Pr ${n}` : 'Pr',
      name: overtimes > 1 ? `${n}ª prorrogação` : 'prorrogação',
      ...period,
    };
  });
}
