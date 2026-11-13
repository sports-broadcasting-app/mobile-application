import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '../test-utils';
import { OnboardingGate } from '../components/OnboardingGate';
import { useNotifications } from '../contexts/NotificationsContext';
import { getFavorites, getTeams, saveFavorite } from '../data/database';
import { awayTeam, homeTeam } from '../test-fixtures';

jest.mock('../contexts/SyncContext', () => ({
  useSync: () => ({ lastSyncAt: 1000 }),
}));
jest.mock('../contexts/NotificationsContext', () => ({
  useNotifications: jest.fn(),
}));
jest.mock('../data/database', () => ({
  getFavorites: jest.fn(),
  getTeams: jest.fn(),
  saveFavorite: jest.fn(async () => {}),
  deleteFavorite: jest.fn(async () => {}),
}));

const setEnabled = jest.fn(async () => true);

function renderGate() {
  render(
    <OnboardingGate>
      <Text>App</Text>
    </OnboardingGate>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (getFavorites as jest.Mock).mockResolvedValue({});
  (getTeams as jest.Mock).mockResolvedValue([homeTeam, awayTeam]);
  (useNotifications as jest.Mock).mockReturnValue({
    supported: true,
    enabled: false,
    setEnabled,
  });
});

describe('Onboarding', () => {
  it('goes straight to the app once it was done', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    renderGate();
    expect(await screen.findByText('App')).toBeTruthy();
    expect(screen.queryByText('Bem-vindo ao Onde Passa')).toBeNull();
  });

  it('can be skipped without picking a team', async () => {
    renderGate();
    fireEvent.press(await screen.findByText('Pular por enquanto'));
    expect(await screen.findByText('App')).toBeTruthy();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@onboarding_done',
      'true',
    );
    expect(setEnabled).not.toHaveBeenCalled();
  });

  it('picks a team, then turns the reminders on', async () => {
    renderGate();
    fireEvent.press(await screen.findByTestId('team-option-1'));
    await waitFor(() =>
      expect(saveFavorite).toHaveBeenCalledWith('masculina', '1'),
    );
    fireEvent.press(await screen.findByText('Continuar'));

    expect(
      await screen.findByText(/30 minutos antes dos jogos de Sada Cruzeiro/),
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('onboarding-enable-reminders'));
    await waitFor(() => expect(setEnabled).toHaveBeenCalledWith(true));
    expect(await screen.findByText('App')).toBeTruthy();
  });

  it('lets the user decline the reminders', async () => {
    (getFavorites as jest.Mock).mockResolvedValue({ masculina: '2' });
    renderGate();
    fireEvent.press(await screen.findByText('Continuar'));
    fireEvent.press(await screen.findByTestId('onboarding-skip-reminders'));
    expect(await screen.findByText('App')).toBeTruthy();
    expect(setEnabled).not.toHaveBeenCalled();
  });
});
