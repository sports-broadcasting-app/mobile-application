import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { fireEvent, render, screen, waitFor } from '../test-utils';
import { ReminderToggle } from '../components/ReminderToggle';
import SettingsScreen from '../screens/SettingsScreen';
import { useNotifications } from '../contexts/NotificationsContext';
import { getFavorites } from '../data/database';

jest.mock('expo-linking', () => ({
  openSettings: jest.fn(() => Promise.resolve()),
}));
jest.mock('../contexts/SyncContext', () => ({
  useSync: () => ({ lastSyncAt: 1000 }),
}));
jest.mock('../contexts/NotificationsContext', () => ({
  useNotifications: jest.fn(),
}));
jest.mock('../data/database', () => ({
  getFavorites: jest.fn(),
  getTeams: jest.fn(async () => []),
  saveFavorite: jest.fn(async () => {}),
  deleteFavorite: jest.fn(async () => {}),
}));

const setEnabled = jest.fn();
const requestExactAlarms = jest.fn();

function mockNotifications(
  enabled: boolean,
  supported = true,
  exactAlarms = true,
) {
  (useNotifications as jest.Mock).mockReturnValue({
    supported,
    enabled,
    setEnabled,
    exactAlarms,
    requestExactAlarms,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (getFavorites as jest.Mock).mockResolvedValue({ masculina: '1' });
  setEnabled.mockResolvedValue(true);
  requestExactAlarms.mockResolvedValue(true);
});

describe('ReminderToggle', () => {
  it('turns the reminders off from the app', async () => {
    mockNotifications(true);
    render(<ReminderToggle />);
    const toggle = await screen.findByTestId('reminder-switch');
    expect(toggle.props.value).toBe(true);
    expect(
      await screen.findByText(/30 minutos antes dos jogos dos seus times/),
    ).toBeTruthy();

    fireEvent(toggle, 'valueChange', false);
    await waitFor(() => expect(setEnabled).toHaveBeenCalledWith(false));
  });

  it('points to the system settings when the permission is blocked', async () => {
    mockNotifications(false);
    setEnabled.mockResolvedValue(false);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<ReminderToggle />);

    fireEvent(
      await screen.findByTestId('reminder-switch'),
      'valueChange',
      true,
    );
    await waitFor(() => expect(alert).toHaveBeenCalled());
    const buttons = alert.mock.calls[0][2] ?? [];
    buttons.find((button) => button.text === 'Abrir ajustes')?.onPress?.();
    expect(Linking.openSettings).toHaveBeenCalled();
  });

  it('asks for a favorite before there is one', async () => {
    (getFavorites as jest.Mock).mockResolvedValue({});
    mockNotifications(false);
    render(<ReminderToggle />);
    expect(
      await screen.findByText(
        'Escolha um time favorito abaixo para receber avisos',
      ),
    ).toBeTruthy();
  });

  it('shows in the settings only where reminders exist', async () => {
    mockNotifications(false);
    render(<SettingsScreen />);
    expect(await screen.findByTestId('reminder-switch')).toBeTruthy();

    mockNotifications(false, false);
    screen.rerender(<SettingsScreen />);
    expect(screen.queryByTestId('reminder-switch')).toBeNull();
  });

  it('explains exact alarms after turning on where they are blocked', async () => {
    mockNotifications(false, true, false);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<ReminderToggle />);

    fireEvent(
      await screen.findByTestId('reminder-switch'),
      'valueChange',
      true,
    );
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        'Avisos na hora certa',
        expect.stringContaining('Alarmes e lembretes'),
        expect.any(Array),
        expect.any(Object),
      ),
    );
    const buttons = alert.mock.calls[0][2] ?? [];
    buttons.find((button) => button.text === 'Permitir')?.onPress?.();
    expect(requestExactAlarms).toHaveBeenCalled();
  });

  it('does not ask for exact alarms where they are already allowed', async () => {
    mockNotifications(false);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<ReminderToggle />);
    fireEvent(
      await screen.findByTestId('reminder-switch'),
      'valueChange',
      true,
    );
    await waitFor(() => expect(setEnabled).toHaveBeenCalledWith(true));
    expect(alert).not.toHaveBeenCalled();
    expect(screen.queryByTestId('exact-alarms-notice')).toBeNull();
  });

  it('warns that reminders may be late while exact alarms are off', async () => {
    mockNotifications(true, true, false);
    render(<ReminderToggle />);
    fireEvent.press(await screen.findByTestId('exact-alarms-notice'));
    expect(requestExactAlarms).toHaveBeenCalled();
  });
});
