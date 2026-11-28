import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@/test/utils';
import SettingsScreen from './SettingsScreen';
import { useNotifications } from '@/features/reminders/model/NotificationsContext';
import { getTeams } from '@/shared/api/database';
import { awayTeam, homeTeam } from '@/test/fixtures';

jest.mock('expo-linking', () => ({ openSettings: jest.fn() }));
jest.mock('@/shared/api/sync/SyncContext', () => ({
  useSync: () => ({ lastSyncAt: 1000 }),
}));
jest.mock('@/features/reminders/model/NotificationsContext', () => ({
  useNotifications: jest.fn(),
}));
jest.mock('@/shared/api/database', () => ({
  getFavorites: jest.fn(async () => ({})),
  getTeams: jest.fn(),
  saveFavorite: jest.fn(async () => {}),
  deleteFavorite: jest.fn(async () => {}),
}));

const setEnabled = jest.fn(async () => true);

function mockNotifications(enabled: boolean) {
  (useNotifications as jest.Mock).mockReturnValue({
    supported: true,
    enabled,
    setEnabled,
    exactAlarms: true,
    requestExactAlarms: jest.fn(async () => true),
    sessionKinds: ['race', 'qualifying'],
    setSessionKind: jest.fn(),
  });
}

async function pickFirstTeam() {
  render(<SettingsScreen />);
  fireEvent.press(await screen.findByTestId('pick-team-masculina'));
  fireEvent.press(await screen.findByTestId('team-option-1'));
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (getTeams as jest.Mock).mockResolvedValue([homeTeam, awayTeam]);
});

describe('Settings reminder offer', () => {
  it('offers reminders when the first team is chosen', async () => {
    mockNotifications(false);
    const alert = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) => {
        buttons?.find((b) => b.text === 'Ativar avisos')?.onPress?.();
      });
    await pickFirstTeam();
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        'Avisar antes dos jogos?',
        expect.stringContaining('Sada Cruzeiro'),
        expect.any(Array),
      ),
    );
    expect(setEnabled).toHaveBeenCalledWith(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@reminders_offered',
      'true',
    );
  });

  it('asks only once', async () => {
    mockNotifications(false);
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key) =>
      key === '@reminders_offered' ? 'true' : null,
    );
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await pickFirstTeam();
    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
    expect(alert).not.toHaveBeenCalled();
  });

  it('does not ask when reminders are already on', async () => {
    mockNotifications(true);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await pickFirstTeam();
    await waitFor(() => expect(screen.queryByTestId('team-sheet')).toBeNull());
    expect(alert).not.toHaveBeenCalled();
  });
});
