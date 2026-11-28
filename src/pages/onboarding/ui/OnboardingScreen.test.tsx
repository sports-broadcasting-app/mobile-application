import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@/test/utils';
import { OnboardingGate } from '@/app/OnboardingGate';

jest.mock('@/shared/api/sync/SyncContext', () => ({
  useSync: () => ({ lastSyncAt: 1000 }),
}));
jest.mock('@/shared/api/database', () => ({
  getFavorites: jest.fn(async () => ({})),
  getTeams: jest.fn(async () => []),
  saveFavorite: jest.fn(async () => {}),
  deleteFavorite: jest.fn(async () => {}),
}));

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
});

describe('Onboarding', () => {
  it('goes straight to the app once it was done', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key) =>
      key === '@onboarding_done' ? 'true' : null,
    );
    renderGate();
    expect(await screen.findByText('App')).toBeTruthy();
    expect(screen.queryByText('Quais esportes você acompanha?')).toBeNull();
  });

  it('asks for at least one sport', async () => {
    renderGate();
    const next = await screen.findByTestId('onboarding-next');
    expect(next).toHaveTextContent('Escolha pelo menos um');
    fireEvent.press(next);
    expect(screen.queryByText('App')).toBeNull();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('picks sports, then their competitions, already marked', async () => {
    renderGate();
    fireEvent.press(await screen.findByTestId('onboarding-sport-volei'));
    fireEvent.press(screen.getByTestId('onboarding-sport-automobilismo'));
    expect(screen.getByTestId('onboarding-next')).toHaveTextContent(
      'Continuar',
    );
    fireEvent.press(screen.getByTestId('onboarding-next'));

    // Step 2: both Superligas marked; the Formula 1 needs no choice but
    // is listed too.
    expect(
      screen.getByTestId('onboarding-feminina').props.accessibilityState
        .checked,
    ).toBe(true);
    fireEvent.press(screen.getByTestId('onboarding-feminina'));

    fireEvent.press(screen.getByTestId('onboarding-start'));
    expect(await screen.findByText('App')).toBeTruthy();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@followed_competitions',
      JSON.stringify(['masculina', 'f1']),
    );
    // Everything in this version was offered: no "Novidade" card later.
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@known_competitions',
      expect.stringContaining('f1'),
    );
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@onboarding_done',
        'true',
      ),
    );
  });

  it('skips the second step when each sport has a single competition', async () => {
    renderGate();
    fireEvent.press(await screen.findByTestId('onboarding-sport-futebol'));
    fireEvent.press(screen.getByTestId('onboarding-sport-basquete'));
    expect(screen.getByTestId('onboarding-next')).toHaveTextContent('Começar');
    fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(await screen.findByText('App')).toBeTruthy();
    // Stored in the app's order, not the tapping order.
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@followed_competitions',
      JSON.stringify(['serie-a', 'nba']),
    );
  });

  it('goes back from the competitions to the sports', async () => {
    renderGate();
    fireEvent.press(await screen.findByTestId('onboarding-sport-volei'));
    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('onboarding-back'));
    expect(screen.getByText('Quais esportes você acompanha?')).toBeTruthy();
  });
});
