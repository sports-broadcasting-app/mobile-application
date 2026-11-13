import { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotificationsProvider,
  useNotifications,
} from '../contexts/NotificationsContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import {
  getFavorites,
  getTeams,
  getUpcomingFavoriteMatches,
} from '../data/database';
import {
  getNotificationPermission,
  replaceScheduledReminders,
  requestNotificationPermission,
} from '../services/notifications';
import { awayTeam, homeTeam, scheduledMatch } from '../test-fixtures';

jest.mock('../contexts/SyncContext', () => ({
  useSync: () => ({ lastSyncAt: 1000 }),
}));
jest.mock('../data/database', () => ({
  getFavorites: jest.fn(),
  getTeams: jest.fn(),
  getUpcomingFavoriteMatches: jest.fn(),
  saveFavorite: jest.fn(async () => {}),
  deleteFavorite: jest.fn(async () => {}),
}));
jest.mock('../services/notifications', () => ({
  NOTIFICATIONS_SUPPORTED: true,
  getNotificationPermission: jest.fn(),
  requestNotificationPermission: jest.fn(),
  replaceScheduledReminders: jest.fn(async () => {}),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <FavoritesProvider>
    <NotificationsProvider>{children}</NotificationsProvider>
  </FavoritesProvider>
);

const upcoming = {
  ...scheduledMatch,
  startsAt: new Date(Date.now() + 3 * 24 * 3600_000).toISOString(),
};

function lastScheduled() {
  const calls = (replaceScheduledReminders as jest.Mock).mock.calls;
  return calls[calls.length - 1][0];
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (getFavorites as jest.Mock).mockResolvedValue({ masculina: '1' });
  (getTeams as jest.Mock).mockResolvedValue([homeTeam, awayTeam]);
  (getUpcomingFavoriteMatches as jest.Mock).mockResolvedValue([upcoming]);
  (getNotificationPermission as jest.Mock).mockResolvedValue('undetermined');
  (requestNotificationPermission as jest.Mock).mockResolvedValue('granted');
});

describe('NotificationsContext', () => {
  it('starts off and schedules nothing until the user opts in', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(replaceScheduledReminders).toHaveBeenCalled());
    expect(result.current.enabled).toBe(false);
    expect(lastScheduled()).toEqual([]);
    expect(requestNotificationPermission).not.toHaveBeenCalled();
  });

  it('asks for the permission and schedules the favorite matches', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(replaceScheduledReminders).toHaveBeenCalled());

    let done = false;
    await act(async () => {
      done = await result.current.setEnabled(true);
    });
    expect(done).toBe(true);
    expect(result.current.enabled).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@match_reminders', 'on');
    await waitFor(() =>
      expect(lastScheduled()).toEqual([
        expect.objectContaining({ id: 'match-100', matchId: '100' }),
      ]),
    );
    expect(getUpcomingFavoriteMatches).toHaveBeenLastCalledWith(
      { masculina: '1' },
      expect.any(Number),
      60,
    );
  });

  it('stays off when the system permission is refused', async () => {
    (requestNotificationPermission as jest.Mock).mockResolvedValue('denied');
    const { result } = renderHook(() => useNotifications(), { wrapper });

    let done = true;
    await act(async () => {
      done = await result.current.setEnabled(true);
    });
    expect(done).toBe(false);
    expect(result.current.enabled).toBe(false);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('cancels the reminders when turned off in the app', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('on');
    (getNotificationPermission as jest.Mock).mockResolvedValue('granted');
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.enabled).toBe(true));
    await waitFor(() => expect(lastScheduled()).toHaveLength(1));

    await act(async () => {
      await result.current.setEnabled(false);
    });
    expect(result.current.enabled).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@match_reminders',
      'off',
    );
    await waitFor(() => expect(lastScheduled()).toEqual([]));
  });

  it('schedules nothing while the permission is off in the system', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('on');
    (getNotificationPermission as jest.Mock).mockResolvedValue('denied');
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(replaceScheduledReminders).toHaveBeenCalled());
    expect(result.current.enabled).toBe(false);
    expect(lastScheduled()).toEqual([]);
  });
});
