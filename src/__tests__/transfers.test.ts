import { awayTeam, homeTeam, transfers } from '../test-fixtures';
import {
  filterTransfers,
  findTeams,
  splitByTeam,
  formatTransferDate,
  getFavoriteDirection,
  getSourceName,
  splitByFavorite,
} from '../utils/transfers';

describe('transfers', () => {
  it('tells whether the favorite gained or lost the athlete', () => {
    expect(getFavoriteDirection(transfers[0], '1')).toBe('in');
    expect(getFavoriteDirection(transfers[0], '2')).toBe('out');
    expect(getFavoriteDirection(transfers[1], '1')).toBeNull();
    expect(getFavoriteDirection(transfers[0], undefined)).toBeNull();
  });

  it('puts the favorite transfers apart, keeping the order', () => {
    const { mine, others } = splitByFavorite(transfers, '1');
    expect(mine.map((transfer) => transfer.id)).toEqual(['t1', 't3']);
    expect(others.map((transfer) => transfer.id)).toEqual(['t2']);
  });

  it('lists everything as others without a favorite', () => {
    expect(splitByFavorite(transfers, undefined).others).toHaveLength(3);
  });

  it('searches athlete, position and clubs ignoring accents', () => {
    expect(filterTransfers(transfers, 'modena').map((t) => t.id)).toEqual([
      't2',
    ]);
    expect(filterTransfers(transfers, 'vôlei renata')).toHaveLength(2);
    expect(filterTransfers(transfers, 'PONTEIRA')).toHaveLength(1);
    expect(filterTransfers(transfers, '  ')).toHaveLength(3);
  });

  it('splits a team into arrivals and departures', () => {
    const { arrivals, departures } = splitByTeam(transfers, '2');
    expect(arrivals.map((t) => t.id)).toEqual(['t2']);
    expect(departures.map((t) => t.id)).toEqual(['t1']);
  });

  it('finds teams by name or code, ignoring accents', () => {
    expect(findTeams([homeTeam, awayTeam], 'vôlei').map((t) => t.id)).toEqual([
      '2',
    ]);
    expect(findTeams([homeTeam, awayTeam], 'sad')).toEqual([homeTeam]);
    expect(findTeams([homeTeam, awayTeam], '')).toEqual([]);
  });

  it('names the source by its site', () => {
    expect(getSourceName(transfers[0].sourceUrl)).toBe('lance.com.br');
    expect(getSourceName(transfers[1].sourceUrl)).toBe('ge.globo.com');
  });

  it('formats the calendar date', () => {
    expect(formatTransferDate('2026-10-28')).toBe('28/10');
  });
});
