import {
  addDays,
  formatDay,
  formatMatchDate,
  formatRelativeSync,
  formatTime,
  getDayBounds,
} from '../utils/date';

describe('date utils', () => {
  it('converts the source offset to the local time', () => {
    expect(formatTime('2026-10-21T02:00:00+02:00')).toBe('21:00');
    expect(formatMatchDate('2026-10-21T02:00:00+02:00')).toBe(
      'ter, 20/10 - 21:00',
    );
  });

  it('crosses month boundaries', () => {
    expect(formatDay(addDays(new Date(2026, 9, 31), 1))).toBe('dom, 01/11');
  });

  it('builds a half-open local day', () => {
    const { start, end } = getDayBounds(new Date(2026, 10, 1, 15));
    expect(start).toBe(new Date(2026, 10, 1).getTime());
    expect(end).toBe(new Date(2026, 10, 2).getTime());
  });

  it('describes the last sync', () => {
    const now = new Date(2026, 10, 3, 12).getTime();
    const minute = 60000;
    expect(formatRelativeSync(now, now)).toBe('Atualizado agora');
    expect(formatRelativeSync(now - 5 * minute, now)).toBe(
      'Atualizado há 5 min',
    );
    expect(formatRelativeSync(now - 120 * minute, now)).toBe(
      'Atualizado há 2 h',
    );
    expect(formatRelativeSync(new Date(2026, 10, 1).getTime(), now)).toBe(
      'Atualizado em dom, 01/11',
    );
  });
});
