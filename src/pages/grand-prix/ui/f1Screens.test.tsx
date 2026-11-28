import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { fireEvent, render, screen, waitFor } from '@/test/utils';
import HomeScreen from '@/pages/home/ui/HomeScreen';
import GrandPrixScreen from './GrandPrixScreen';
import StandingsScreen from '@/pages/standings/ui/StandingsScreen';
import { DayStrip } from '@/pages/home/ui/DayStrip';
import { SessionRemindersSheet } from '@/features/reminders/ui/SessionRemindersSheet';
import { useSync } from '@/shared/api/sync/SyncContext';
import { useNotifications } from '@/features/reminders/model/NotificationsContext';
import {
  getEventStarts,
  getGrandPrix,
  getNextSessions,
  getSessionsBetween,
} from '@/shared/api/database';
import { raceSessions } from '@/test/fixtures';
import { addDays, getDayBounds } from '@/shared/lib/date';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: jest.fn(),
  Stack: { Screen: () => null },
}));
jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/shared/api/sync/SyncContext', () => ({ useSync: jest.fn() }));
jest.mock('@/features/reminders/model/NotificationsContext', () => ({
  useNotifications: jest.fn(),
}));
jest.mock('@/shared/api/database', () => ({
  deleteFavorite: jest.fn(async () => {}),
  getFavorites: jest.fn(async () => ({})),
  getMatchesBetween: jest.fn(async () => []),
  getNextMatches: jest.fn(async () => []),
  getSessionsBetween: jest.fn(async () => []),
  getNextSessions: jest.fn(async () => []),
  getEventStarts: jest.fn(async () => []),
  getGrandPrix: jest.fn(async () => []),
  getStandings: jest.fn(async () => []),
  getTeams: jest.fn(async () => []),
  countTransfers: jest.fn(async () => 0),
  saveFavorite: jest.fn(async () => {}),
}));

const setEnabled = jest.fn(async () => true);
const setSessionKind = jest.fn();

function mockNotifications(enabled: boolean) {
  (useNotifications as jest.Mock).mockReturnValue({
    supported: true,
    enabled,
    setEnabled,
    exactAlarms: true,
    requestExactAlarms: jest.fn(async () => true),
    sessionKinds: ['race', 'qualifying'],
    setSessionKind,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (useSync as jest.Mock).mockReturnValue({
    lastSyncAt: Date.now(),
    dataVersion: 'v1',
    refreshing: false,
    refreshFailed: false,
    refresh: jest.fn(),
  });
  mockNotifications(true);
});

describe('Formula 1 on the Home', () => {
  it('shows the day sessions as one weekend card that opens it', async () => {
    (getSessionsBetween as jest.Mock).mockResolvedValue([raceSessions[0]]);
    render(<HomeScreen />);
    expect(await screen.findByTestId('section-f1')).toHaveTextContent(
      /Fórmula 1.*1 sessão/,
    );
    fireEvent.press(screen.getByTestId('grand-prix-card-gp-do-catar-2026'));
    expect(mockPush).toHaveBeenCalledWith('/grand-prix/gp-do-catar-2026');
  });

  it('filters by F1, the only competition of its sport', async () => {
    (getSessionsBetween as jest.Mock).mockResolvedValue([raceSessions[0]]);
    render(<HomeScreen />);
    fireEvent.press(await screen.findByText('F1'));
    expect(await screen.findByText('Fórmula 1')).toBeTruthy();
    expect(
      await screen.findByTestId('grand-prix-card-gp-do-catar-2026'),
    ).toBeTruthy();
  });

  it('lists coming sessions on an empty day', async () => {
    (getNextSessions as jest.Mock).mockResolvedValue([raceSessions[2]]);
    render(<HomeScreen />);
    fireEvent.press(await screen.findByTestId('session-row-7238'));
    expect(mockPush).toHaveBeenCalledWith('/grand-prix/gp-do-catar-2026');
  });

  it('offers Formula 1 once to installs that chose before it existed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key) =>
      key === '@followed_competitions' ? '["serie-a"]' : null,
    );
    (getNextSessions as jest.Mock).mockResolvedValue(raceSessions);
    render(<HomeScreen />);
    expect(await screen.findByText('Agora tem Fórmula 1')).toBeTruthy();
    expect(
      await screen.findByText(/O próximo é o GP do Catar, de 27 a 29\/11\./),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('news-follow-f1'));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@followed_competitions',
      JSON.stringify(['serie-a', 'f1']),
    );
    await waitFor(() =>
      expect(screen.queryByText('Agora tem Fórmula 1')).toBeNull(),
    );
  });

  it('leaves Formula 1 off when the offer is declined', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key) =>
      key === '@followed_competitions' ? '["serie-a"]' : null,
    );
    render(<HomeScreen />);
    fireEvent.press(await screen.findByTestId('news-dismiss-f1'));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@known_competitions',
      JSON.stringify(['masculina', 'feminina', 'serie-a', 'nfl', 'nba', 'f1']),
    );
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
      '@followed_competitions',
      expect.stringContaining('f1'),
    );
    await waitFor(() => expect(screen.queryByTestId('news-f1')).toBeNull());
  });

  it('marks the strip days that have something', async () => {
    const tomorrow = addDays(new Date(), 1);
    (getEventStarts as jest.Mock).mockResolvedValue([
      getDayBounds(tomorrow).start + 3600_000,
    ]);
    render(<HomeScreen />);
    await waitFor(() =>
      expect(screen.getByTestId('day-1').props.accessibilityLabel).toMatch(
        /com jogos/,
      ),
    );
    expect(screen.getByTestId('day-0').props.accessibilityLabel).not.toMatch(
      /com jogos/,
    );
  });
});

describe('DayStrip', () => {
  it('names yesterday and today and reports the picked day', () => {
    const onSelect = jest.fn();
    render(
      <DayStrip
        today={new Date(2026, 10, 25)}
        selected={0}
        onSelect={onSelect}
        eventDays={new Set()}
      />,
    );
    expect(screen.getByText('Ontem')).toBeTruthy();
    expect(screen.getByText('Hoje')).toBeTruthy();
    // Two weeks ahead: two Fridays.
    expect(screen.getAllByText('Sex')).toHaveLength(2);
    fireEvent.press(screen.getByTestId('day-2'));
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});

describe('GrandPrixScreen', () => {
  beforeEach(() => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'gp-do-catar-2026',
    });
    (getGrandPrix as jest.Mock).mockResolvedValue(raceSessions);
  });

  it('shows the next session with its channels and every session by day', async () => {
    render(<GrandPrixScreen />);
    expect(await screen.findByTestId('next-session')).toHaveTextContent(
      /Próxima sessão.*10:30.*1º treino livre/,
    );
    fireEvent.press(screen.getByText('Assistir no SporTV'));
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://globoplay.globo.com/',
    );
    expect(screen.getByTestId('session-7238')).toHaveTextContent(
      /Corrida.*Transmissão a definir/,
    );
  });

  it('turns a kind of session on or off from its bell', async () => {
    render(<GrandPrixScreen />);
    const raceBell = await screen.findByTestId('bell-7238');
    expect(raceBell.props.accessibilityState.checked).toBe(true);
    expect(raceBell.props.accessibilityLabel).toBe(
      'Avisar antes de as corridas',
    );
    fireEvent.press(raceBell);
    expect(setSessionKind).toHaveBeenCalledWith('race', false);
    fireEvent.press(screen.getByTestId('bell-7234'));
    expect(setSessionKind).toHaveBeenCalledWith('practice', true);
  });

  it('asks for the permission when a bell is turned on with reminders off', async () => {
    mockNotifications(false);
    render(<GrandPrixScreen />);
    fireEvent.press(await screen.findByTestId('bell-7238'));
    expect(setSessionKind).toHaveBeenCalledWith('race', true);
    expect(setEnabled).toHaveBeenCalledWith(true);
  });

  it('explains exact alarms after a bell turned the reminders on', async () => {
    (useNotifications as jest.Mock).mockReturnValue({
      supported: true,
      enabled: false,
      setEnabled,
      exactAlarms: false,
      requestExactAlarms: jest.fn(async () => true),
      sessionKinds: ['race', 'qualifying'],
      setSessionKind,
    });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<GrandPrixScreen />);
    fireEvent.press(await screen.findByTestId('bell-7238'));
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        'Avisos na hora certa',
        expect.any(String),
        expect.any(Array),
        expect.any(Object),
      ),
    );
  });

  it('says so when the weekend is not in the data', async () => {
    (getGrandPrix as jest.Mock).mockResolvedValue([]);
    render(<GrandPrixScreen />);
    expect(await screen.findByText('GP não encontrado')).toBeTruthy();
  });
});

describe('SessionRemindersSheet', () => {
  it('switches reminders by kind of session', () => {
    render(<SessionRemindersSheet visible onClose={jest.fn()} />);
    expect(screen.getByTestId('session-kind-race').props.value).toBe(true);
    expect(screen.getByTestId('session-kind-practice').props.value).toBe(false);
    fireEvent(screen.getByTestId('session-kind-sprint'), 'valueChange', true);
    expect(setSessionKind).toHaveBeenCalledWith('sprint', true);
  });
});

describe('Formula 1 standings', () => {
  it('explains that there is no table yet', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key) =>
      key === '@followed_competitions' ? '["f1"]' : null,
    );
    render(<StandingsScreen />);
    expect(
      await screen.findByTestId('standings-unavailable'),
    ).toHaveTextContent(/Fórmula 1 ainda não está no app/);
  });
});
