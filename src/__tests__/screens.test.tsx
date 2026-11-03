import { fireEvent, render, screen, waitFor } from '../test-utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsScreen from '../screens/SettingsScreen';
import HomeScreen from '../screens/HomeScreen';
import MatchDetailScreen from '../screens/MatchDetailScreen';
import StandingsScreen from '../screens/StandingsScreen';
import TransfersScreen from '../screens/TransfersScreen';
import { useSync } from '../contexts/SyncContext';
import {
  countTransfers,
  deleteFavorite,
  getFavorites,
  getMatch,
  getMatchesBetween,
  getNextMatches,
  getStandings,
  getTeams,
  getTransfers,
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
  transfers,
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
  getTransfers: jest.fn(async () => []),
  countTransfers: jest.fn(async () => 0),
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
  (getTransfers as jest.Mock).mockResolvedValue([]);
  (countTransfers as jest.Mock).mockResolvedValue(0);
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

  it('names the selected competition in the title', async () => {
    mockDayMatches([scheduledMatch]);
    render(<HomeScreen />);
    expect(screen.getByText('Superliga')).toBeTruthy();
    fireEvent.press(screen.getByText('Masculina'));
    expect(await screen.findByText('Superliga Masculina')).toBeTruthy();
  });

  it('changes the day', async () => {
    render(<HomeScreen />);
    await screen.findByText('Nenhum jogo neste dia');
    const calls = (getMatchesBetween as jest.Mock).mock.calls.length;
    fireEvent.press(screen.getByText('Amanhã'));
    await waitFor(() =>
      expect(
        (getMatchesBetween as jest.Mock).mock.calls.length,
      ).toBeGreaterThan(calls),
    );
  });

  it('suggests next matches on an empty day', async () => {
    (getNextMatches as jest.Mock).mockResolvedValue([scheduledMatch]);
    render(<HomeScreen />);
    expect(await screen.findByText('Próximos jogos')).toBeTruthy();
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
    fireEvent.press(await screen.findByText(/Escolha seu time/));
    expect(mockPush).toHaveBeenCalledWith('/configuracoes');
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

  it('links to transfers only when there are some', async () => {
    (getStandings as jest.Mock).mockResolvedValue([]);
    const { unmount } = render(<StandingsScreen />);
    await screen.findByTestId('standings-legend');
    expect(screen.queryByTestId('open-transfers')).toBeNull();
    unmount();

    (countTransfers as jest.Mock).mockResolvedValue(3);
    render(<StandingsScreen />);
    fireEvent.press(await screen.findByTestId('open-transfers'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/transferencias',
      params: { competition: 'masculina' },
    });
  });

  it('explains every column in the legend', async () => {
    (getStandings as jest.Mock).mockResolvedValue([]);
    render(<StandingsScreen />);
    const legend = await screen.findByTestId('standings-legend');
    expect(legend).toHaveTextContent(/P\s+Pontos/);
    expect(legend).toHaveTextContent(/SP\s+Sets perdidos/);
  });
});

describe('TransfersScreen', () => {
  beforeEach(() => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    (getTransfers as jest.Mock).mockResolvedValue(transfers);
  });

  it('lists every transfer without a favorite', async () => {
    render(<TransfersScreen />);
    expect(await screen.findByText('Todas')).toBeTruthy();
    expect(screen.getByTestId('transfer-card-t2')).toBeTruthy();
    expect(screen.queryByText('Seu time')).toBeNull();
  });

  it('opens the news article a transfer came from', async () => {
    render(<TransfersScreen />);
    fireEvent.press(await screen.findByTestId('transfer-source-t1'));
    expect(screen.getByText('Fonte: lance.com.br')).toBeTruthy();
    expect(Linking.openURL).toHaveBeenCalledWith(transfers[0].sourceUrl);
  });

  it('puts the favorite team first and marks arrivals and departures', async () => {
    (getFavorites as jest.Mock).mockResolvedValue({ masculina: '1' });
    render(<TransfersScreen />);
    expect(await screen.findByText('Seu time')).toBeTruthy();
    expect(screen.getByText('Demais times')).toBeTruthy();
    expect(screen.getByText('Chegou ao seu time')).toBeTruthy();
    expect(screen.getByText('Saiu do seu time')).toBeTruthy();
  });

  it('searches and says when nothing matches', async () => {
    render(<TransfersScreen />);
    await screen.findByTestId('transfer-card-t1');
    fireEvent.changeText(screen.getByTestId('transfer-search'), 'modena');
    expect(screen.queryByTestId('transfer-card-t1')).toBeNull();
    expect(screen.getByTestId('transfer-card-t2')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('transfer-search'), 'xyz');
    expect(screen.getByText('Nenhuma transferência encontrada')).toBeTruthy();
  });

  it('opens on the competition it was given', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      competition: 'feminina',
    });
    (getTransfers as jest.Mock).mockResolvedValue([]);
    render(<TransfersScreen />);
    expect(
      await screen.findByText(
        'Nenhuma transferência registrada nesta temporada',
      ),
    ).toBeTruthy();
    expect(getTransfers).toHaveBeenCalledWith('feminina');
  });
});

describe('SettingsScreen', () => {
  it('saves and removes a favorite in the database', async () => {
    render(<SettingsScreen />);
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

describe('SettingsScreen search and theme', () => {
  it('finds a team ignoring case and accents', async () => {
    (getTeams as jest.Mock).mockResolvedValue([
      homeTeam,
      { ...awayTeam, name: 'VÔLEI RENATA' },
    ]);
    render(<SettingsScreen />);
    await screen.findByTestId('team-option-2');
    fireEvent.changeText(screen.getByTestId('team-search'), 'volei');
    await waitFor(() =>
      expect(screen.queryByTestId('team-option-1')).toBeNull(),
    );
    expect(screen.getByTestId('team-option-2')).toBeTruthy();
  });

  it('says when no team matches', async () => {
    render(<SettingsScreen />);
    await screen.findByTestId('team-option-1');
    fireEvent.changeText(screen.getByTestId('team-search'), 'xyz');
    expect(await screen.findByText('Nenhum time encontrado')).toBeTruthy();
  });

  it('saves the chosen appearance', async () => {
    render(<SettingsScreen />);
    expect(
      (await screen.findByTestId('appearance-system')).props.accessibilityState
        .selected,
    ).toBe(true);
    fireEvent.press(screen.getByTestId('appearance-dark'));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@theme_mode', 'dark');
    await waitFor(() =>
      expect(
        screen.getByTestId('appearance-dark').props.accessibilityState.selected,
      ).toBe(true),
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
    expect(await screen.findByText('Jogo não encontrado')).toBeTruthy();
  });
});
