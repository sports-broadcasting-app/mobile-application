import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_COMPETITIONS } from '../constants/competitions';
import {
  CompetitionProvider,
  useCompetition,
} from '../contexts/CompetitionContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <CompetitionProvider>{children}</CompetitionProvider>
);

describe('CompetitionContext', () => {
  it('carries the Home filter over to the standings', () => {
    const { result } = renderHook(() => useCompetition(), { wrapper });
    expect(result.current.competition).toBe('masculina');

    act(() => result.current.setFilter('serie-a'));
    expect(result.current.filter).toBe('serie-a');
    expect(result.current.competition).toBe('serie-a');
  });

  it('keeps the standings where they were when Home shows every game', () => {
    const { result } = renderHook(() => useCompetition(), { wrapper });
    act(() => result.current.setFilter('feminina'));
    act(() => result.current.setFilter('todos'));
    expect(result.current.filter).toBe('todos');
    expect(result.current.competition).toBe('feminina');
  });

  it('filters the Home by what the standings picked', () => {
    const { result } = renderHook(() => useCompetition(), { wrapper });
    act(() => result.current.setCompetition('serie-a'));
    expect(result.current.filter).toBe('serie-a');
    expect(result.current.competition).toBe('serie-a');
  });

  it('follows everything until the user chooses', () => {
    const { result } = renderHook(() => useCompetition(), { wrapper });
    expect(result.current.followed).toEqual([
      'masculina',
      'feminina',
      'serie-a',
      'nfl',
      'nba',
    ]);
  });

  it('loads the stored choice, dropping unknown slugs', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      '["nfl","cricket","serie-a"]',
    );
    const { result } = renderHook(() => useCompetition(), { wrapper });
    await waitFor(() =>
      expect(result.current.followed).toEqual(['serie-a', 'nfl']),
    );
    expect(result.current.competition).toBe('serie-a');
  });

  it('never ends with nothing followed', () => {
    const { result } = renderHook(() => useCompetition(), { wrapper });
    act(() => result.current.setFollowed([]));
    expect(result.current.followed).toEqual(ALL_COMPETITIONS);
  });

  it('leaves a filter the user stopped following', async () => {
    const { result } = renderHook(() => useCompetition(), { wrapper });
    act(() => result.current.setFilter('nfl'));
    act(() => result.current.setFollowed(['masculina', 'serie-a']));
    await waitFor(() => expect(result.current.filter).toBe('todos'));
    expect(result.current.competition).toBe('masculina');
    expect(result.current.isFollowed('nfl')).toBe(false);
  });
});
