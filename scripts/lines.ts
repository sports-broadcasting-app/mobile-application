import type { SetScore } from '../src/shared/api/snapshot';

export const sum = (lines: number[]) =>
  lines.reduce((total, points) => total + points, 0);

/** Two teams' points per period, side by side; null when the counts differ. */
export function pairLines(home: number[], away: number[]): SetScore[] | null {
  if (home.length !== away.length) return null;
  const periods: SetScore[] = [];
  home.forEach((points, i) => {
    const other = away[i];
    if (other !== undefined) periods.push({ home: points, away: other });
  });
  return periods;
}
