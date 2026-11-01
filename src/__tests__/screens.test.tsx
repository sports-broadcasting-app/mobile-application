import { fireEvent, render, screen, waitFor } from '../test-utils';
import FavoritesScreen from '../screens/FavoritesScreen';
import HomeScreen from '../screens/HomeScreen';
import MatchDetailScreen from '../screens/MatchDetailScreen';
import StandingsScreen from '../screens/StandingsScreen';
import { useSync } from '../contexts/SyncContext';
import {
  deleteFavorite,
  getFavorites,
  getMatch,
  getMatchesBetween,
  getNextMatches,
  getStandings,
  getTeams,
  saveFavorite,
} from '../data/database';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import {
  awayTeam,
  buildSnapshot,
  finishedMatch,
  homeTeam,
  scheduledMatch,
} from '../test-fixtures';
import { Match } from '../types/superliga';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: jest.fn(),
  Stack: { Screen: () => null },
}));
jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
}));
jest.mock('../contexts/SyncContext', () => ({ useSync: jest.fn() }));
jest.mock('../data/database', () => ({
  deleteFavorite: jest.fn(async () => {}),
  getFavorites: jest.fn(async () => ({})),
  getMatch: jest.fn(),
  getMatchesBetween: jest.fn(async () => []),
  getNextMatches: jest.fn(async () => []),
  getStandings: jest.fn(async () => []),
  getTeams: jest.fn(async () => []),
  saveFavorite: jest.fn(async () => {}),
}));

function mockDayMatches(matches: Match[]) {
  (getMatchesBetween as jest.Mock).mockResolvedValue(matches);
}

beforeEach(() => {
  jest.clearAllMocks();
  (useSync as jest.Mock).mockReturnValue({
    lastSyncAt: Date.now(),
    refreshing: false,
    refreshFailed: false,
    refresh: jest.fn(),
  });
  (getTeams as jest.Mock).mockResolvedValue([homeTeam, awayTeam]);
  (getFavorites as jest.Mock).mockResolvedValue({});
  mockDayMatches([]);
  (getNextMatches as jest.Mock).mockResolvedValue([]);
});

describe('HomeScreen', () => {
  it('lists the day matches and opens the detail', async () => {
    mockDayMatches([scheduledMatch]);
    render(<HomeScreen />);
    fireEvent.press(await screen.findByTestId('match-card-100'));
    expect(mockPush).toHaveBeenCalledWith('/match/100');
  });

  it('filters by competition', async () => {
    mockDayMatches([scheduledMatch]);
    render(<HomeScreen />);
    await screen.findByTestId('match-card-100');
    fireEvent.press(screen.getByText('Feminina'));
    await waitFor(() =>
      expect(screen.queryByTestId('match-card-100')).toBeNull(),
    );
  });

  it('changes the day', async () => {
    render(<HomeScreen />);
    await screen.findByText('Nenhum jogo neste dia');
    const calls = (getMatchesBetween as jest.Mock).mock.calls.length;
    fireEvent.press(screen.getByText('Amanha'));
    await waitFor(() =>
      expect(
        (getMatchesBetween as jest.Mock).mock.calls.length,
      ).toBeGreaterThan(calls),
    );
  });

  it('suggests next matches on an empty day', async () => {
    (getNextMatches as jest.Mock).mockResolvedValue([scheduledMatch]);
    render(<HomeScreen />);
    expect(await screen.findByText('Proximos jogos')).toBeTruthy();
    expect(await screen.findByTestId('match-card-100')).toBeTruthy();
  });

  it('tells when the data is not fresh', async () => {
    (useSync as jest.Mock).mockReturnValue({
      lastSyncAt: 1,
      refreshing: false,
      refreshFailed: true,
      refresh: jest.fn(),
    });
    render(<HomeScreen />);
    expect(await screen.findByText(/dados salvos/)).toBeTruthy();
  });

  it('asks for a favorite only while there is none', async () => {
    render(<HomeScreen />);
    expect(await screen.findByText(/Escolha seu time/)).toBeTruthy();
  });
});

describe('StandingsScreen', () => {
  it('shows the selected competition in order', async () => {
    (getStandings as jest.Mock).mockResolvedValue(
      buildSnapshot([]).competitions[0].standings,
    );
    render(<StandingsScreen />);
    expect(await screen.findByTestId('standing-row-2')).toBeTruthy();
    fireEvent.press(screen.getByText('Feminina'));
    await waitFor(() => expect(getStandings).toHaveBeenCalledWith('feminina'));
  });
});

describe('FavoritesScreen', () => {
  it('saves and removes a favorite in the database', async () => {
    render(<FavoritesScreen />);
    fireEvent.press(await screen.findByTestId('team-option-1'));
    await waitFor(() =>
      expect(saveFavorite).toHaveBeenCalledWith('masculina', '1'),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId('team-option-1').props.accessibilityState.selected,
      ).toBe(true),
    );
    fireEvent.press(screen.getByTestId('team-option-1'));
    await waitFor(() =>
      expect(deleteFavorite).toHaveBeenCalledWith('masculina'),
    );
  });
});

describe('MatchDetailScreen', () => {
  beforeEach(() => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: '101' });
  });

  it('shows the result, sets and channel link', async () => {
    (getMatch as jest.Mock).mockResolvedValue(finishedMatch);
    render(<MatchDetailScreen />);
    expect(await screen.findByText('3 x 1')).toBeTruthy();
    expect(screen.getByText('1º set: 25 x 20')).toBeTruthy();
    fireEvent.press(screen.getByText('Assistir no SporTV 2'));
    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining('globoplay'),
    );
  });

  it('handles an unknown match', async () => {
    (getMatch as jest.Mock).mockResolvedValue(null);
    render(<MatchDetailScreen />);
    expect(await screen.findByText('Jogo nao encontrado')).toBeTruthy();
  });
});
