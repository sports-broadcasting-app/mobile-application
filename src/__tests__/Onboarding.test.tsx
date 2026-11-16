import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '../test-utils';
import { OnboardingGate } from '../components/OnboardingGate';

jest.mock('../contexts/SyncContext', () => ({
  useSync: () => ({ lastSyncAt: 1000 }),
}));
jest.mock('../data/database', () => ({
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
    expect(screen.queryByText('O que você acompanha?')).toBeNull();
  });

  it('asks for at least one competition', async () => {
    renderGate();
    const start = await screen.findByTestId('onboarding-start');
    expect(start).toHaveTextContent('Escolha pelo menos uma');
    fireEvent.press(start);
    expect(screen.queryByText('App')).toBeNull();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('follows the chosen competitions and opens the app', async () => {
    renderGate();
    fireEvent.press(await screen.findByTestId('onboarding-nfl'));
    fireEvent.press(screen.getByTestId('onboarding-serie-a'));
    expect(
      screen.getByTestId('onboarding-nfl').props.accessibilityState.checked,
    ).toBe(true);

    fireEvent.press(screen.getByTestId('onboarding-start'));
    expect(await screen.findByText('App')).toBeTruthy();
    // Stored in the app's order, not the tapping order.
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@followed_competitions',
      JSON.stringify(['serie-a', 'nfl']),
    );
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@onboarding_done',
        'true',
      ),
    );
  });
});
