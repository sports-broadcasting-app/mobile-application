import { act, renderHook } from '@testing-library/react-native';
import { ReactNode } from 'react';
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
});
