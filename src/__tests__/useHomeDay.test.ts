import { renderHook } from '@testing-library/react-native';
import { useHomeDay } from '../hooks/useHomeDay';
import { footballMatch, scheduledMatch } from '../test-fixtures';

jest.mock('../contexts/FavoritesContext', () => ({
  useFavorites: () => ({ favorites: { masculina: '1' } }),
}));

const mockNextMatches = jest.fn();
jest.mock('../hooks/useSuperliga', () => ({
  sortForDisplay: (matches: unknown[]) => matches,
  useDayMatches: () => {
    const fixtures = jest.requireActual('../test-fixtures');
    return {
      data: [
        fixtures.scheduledMatch,
        { ...fixtures.footballMatch, status: 'scheduled' },
      ],
    };
  },
  useDaySessions: () => ({ data: [] }),
  useEventDays: () => new Set<number>(),
  useNextMatches: (...args: unknown[]) => mockNextMatches(...args),
  useNextSessions: () => ({ data: [] }),
}));

describe('useHomeDay', () => {
  beforeEach(() => {
    mockNextMatches.mockReturnValue({ data: [footballMatch] });
  });

  it('splits the day into your teams and the rest, and fills a light day', () => {
    const { result } = renderHook(() =>
      useHomeDay(new Date(), 0, 'todos', ['masculina', 'serie-a']),
    );
    expect(result.current.sections.map((s) => s.key)).toEqual([
      'mine',
      'serie-a',
    ]);
    expect(result.current.isEmpty).toBe(false);
    // Two games is under three: the next ones are asked and shown.
    expect(mockNextMatches).toHaveBeenLastCalledWith(
      expect.any(Number),
      ['masculina', 'serie-a'],
      true,
    );
    expect(result.current.next).toHaveLength(1);
    expect(result.current.isFavoriteMatch(scheduledMatch)).toBe(true);
  });
});
