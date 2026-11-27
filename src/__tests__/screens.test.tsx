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
  flamengo,
  footballMatch,
  footballCompetition,
  homeTeam,
  palmeiras,
  scheduledMatch,
  transfers,
} from '../test-fixtures';
import { Match } from '../types/snapshot';

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
  getSessionsBetween: jest.fn(async () => []),
  getNextSessions: jest.fn(async () => []),
  getEventStarts: jest.fn(async () => []),
  getGrandPrix: jest.fn(async () => []),
  getUpcomingSessions: jest.fn(async () => []),
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
  it('asks where to watch when a match is tapped', async () => {
    mockDayMatches([scheduledMatch]);
    render(<HomeScreen />);
    fireEvent.press(await screen.findByTestId('match-card-100'));
    expect(
      screen.getByText('Quer abrir o app onde o jogo vai passar?'),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('watch-open-GE TV'));
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://www.youtube.com/@getv',
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('opens the detail from the where-to-watch sheet', async () => {
    mockDayMatches([scheduledMatch]);
    render(<HomeScreen />);
    fireEvent.press(await screen.findByTestId('match-card-100'));
    fireEvent.press(screen.getByTestId('watch-details'));
    expect(mockPush).toHaveBeenCalledWith('/match/100');
  });

  it('filters by competition', async () => {
    mockDayMatches([scheduledMatch]);
    render(<HomeScreen />);
    await screen.findByTestId('match-card-100');
    // Two volleyball competitions: the sport chip, then one of them.
    fireEvent.press(screen.getByText('Vôlei'));
    fireEvent.press(await screen.findByText('Superliga F'));
    await waitFor(() =>
      expect(screen.queryByTestId('match-card-100')).toBeNull(),
    );
  });

  it('names the selected competition in the title', async () => {
    mockDayMatches([scheduledMatch]);
    render(<HomeScreen />);
    expect(screen.getByText('Jogos')).toBeTruthy();
    fireEvent.press(screen.getByText('Vôlei'));
    // The sport's row gives way to its competitions: "Vôlei" is the title.
    expect(await screen.findAllByText('Vôlei')).toHaveLength(1);
    fireEvent.press(await screen.findByText('Superliga M'));
    expect(await screen.findByText('Superliga Masculina')).toBeTruthy();
  });

  it('swaps the row for the competitions of a sport, with a way back', async () => {
    render(<HomeScreen />);
    fireEvent.press(await screen.findByText('Vôlei'));
    expect(await screen.findByText('Superliga F')).toBeTruthy();
    expect(screen.queryByText('Todas')).toBeNull();
    expect(screen.queryByText('Brasileirão')).toBeNull();
    // The picked competition again shows the whole sport.
    fireEvent.press(screen.getByText('Superliga F'));
    expect(await screen.findByText('Superliga Feminina')).toBeTruthy();
    fireEvent.press(screen.getByText('Superliga F'));
    expect(await screen.findByText('Vôlei')).toBeTruthy();
    fireEvent.press(screen.getByTestId('chips-back'));
    expect(await screen.findByText('Jogos')).toBeTruthy();
    expect(screen.getByText('Brasileirão')).toBeTruthy();
    expect(screen.queryByTestId('chips-back')).toBeNull();
  });

  it('changes the day', async () => {
    render(<HomeScreen />);
    await screen.findByText('Nenhum jogo neste dia');
    const calls = (getMatchesBetween as jest.Mock).mock.calls.length;
    fireEvent.press(screen.getByTestId('day-1'));
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
    expect(await screen.findByTestId('match-row-100')).toBeTruthy();
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

  it('groups "Todos" into your teams and one section per competition', async () => {
    (getFavorites as jest.Mock).mockResolvedValue({ masculina: '1' });
    (getTeams as jest.Mock).mockResolvedValue([
      homeTeam,
      awayTeam,
      flamengo,
      palmeiras,
    ]);
    mockDayMatches([
      scheduledMatch,
      {
        ...footballMatch,
        status: 'scheduled',
        homeScore: null,
        awayScore: null,
      },
    ]);
    render(<HomeScreen />);
    expect(await screen.findByTestId('section-mine')).toHaveTextContent(
      /Seus times/,
    );
    expect(await screen.findByTestId('section-serie-a')).toHaveTextContent(
      /Brasileirão Série A.*1 jogo/,
    );
    // The favorite's game sits in "Seus times" only.
    expect(screen.queryByTestId('section-masculina')).toBeNull();
    expect(screen.queryByTestId('favorite-pill')).toBeNull();
  });

  it('shows only the competitions the user follows', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key) =>
      key === '@followed_competitions' ? '["serie-a"]' : null,
    );
    mockDayMatches([scheduledMatch]);
    render(<HomeScreen />);
    await waitFor(() => expect(screen.queryByText('Superliga M')).toBeNull());
    expect(screen.getByText('Brasileirão')).toBeTruthy();
    expect(screen.queryByTestId('match-card-100')).toBeNull();
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async () => null);
  });

  it('edits the followed competitions from the chips', async () => {
    render(<HomeScreen />);
    fireEvent.press(await screen.findByTestId('edit-competitions'));
    expect(screen.getByText('Suas competições')).toBeTruthy();
    fireEvent.press(screen.getByTestId('follow-feminina'));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@followed_competitions',
      JSON.stringify(['masculina', 'serie-a', 'nfl', 'nba', 'f1']),
    );
    // Volleyball is down to one competition: its chip names it.
    expect(await screen.findByText('Superliga M')).toBeTruthy();
    expect(screen.queryByText('Superliga F')).toBeNull();
  });

  it('fills a day with few games with the next ones', async () => {
    mockDayMatches([scheduledMatch]);
    (getNextMatches as jest.Mock).mockResolvedValue([
      { ...scheduledMatch, id: '102' },
    ]);
    render(<HomeScreen />);
    fireEvent.press(await screen.findByText('Vôlei'));
    fireEvent.press(await screen.findByText('Superliga M'));
    expect(
      await screen.findByText('Próximos jogos · Superliga M'),
    ).toBeTruthy();
    expect(await screen.findByTestId('match-row-102')).toBeTruthy();
    expect(getNextMatches).toHaveBeenLastCalledWith(expect.any(Number), 6, [
      'masculina',
    ]);
  });
});

describe('StandingsScreen', () => {
  it('shows the selected competition in order', async () => {
    (getStandings as jest.Mock).mockResolvedValue(
      buildSnapshot([]).competitions[0]!.standings,
    );
    render(<StandingsScreen />);
    expect(await screen.findByTestId('standing-row-2')).toBeTruthy();
    fireEvent.press(screen.getByText('Superliga F'));
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

  it('switches to the football columns for the Brasileirão', async () => {
    (getTeams as jest.Mock).mockResolvedValue([flamengo, palmeiras]);
    (getStandings as jest.Mock).mockResolvedValue(
      footballCompetition.standings,
    );
    render(<StandingsScreen />);
    fireEvent.press(screen.getByText('Brasileirão'));
    const row = await screen.findByTestId('standing-row-262');
    expect(row).toHaveTextContent(/Flamengo\s*76\s*34\s*23\s*7\s*4\s*42/);
    const legend = screen.getByTestId('standings-legend');
    expect(legend).toHaveTextContent(/E\s+Empates/);
    expect(legend).toHaveTextContent(/SG\s+Saldo de gols/);
    expect(legend).not.toHaveTextContent(/Sets/);
  });
});

describe('TransfersScreen', () => {
  beforeEach(() => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    (getTransfers as jest.Mock).mockResolvedValue(transfers);
  });

  it('lists every transfer without a favorite', async () => {
    render(<TransfersScreen />);
    expect(
      await screen.findByTestId('transfers-section-Todas'),
    ).toHaveTextContent(/Todas.*· 3/);
    expect(screen.getByTestId('transfer-card-t2')).toBeTruthy();
    expect(screen.queryByText(/^Seu time/)).toBeNull();
  });

  it('opens the news article a transfer came from', async () => {
    render(<TransfersScreen />);
    fireEvent.press(await screen.findByTestId('transfer-source-t1'));
    expect(screen.getByText('Fonte: lance.com.br')).toBeTruthy();
    expect(Linking.openURL).toHaveBeenCalledWith(transfers[0]!.sourceUrl);
  });

  it('puts the favorite team first and marks arrivals and departures', async () => {
    (getFavorites as jest.Mock).mockResolvedValue({ masculina: '1' });
    render(<TransfersScreen />);
    expect(
      await screen.findByTestId('transfers-section-Seu time'),
    ).toHaveTextContent(/Seu time.*· 2/);
    expect(
      screen.getByTestId('transfers-section-Demais times'),
    ).toHaveTextContent(/Demais times.*· 1/);
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

  it('suggests a team and groups its arrivals and departures', async () => {
    render(<TransfersScreen />);
    await screen.findByTestId('transfer-card-t1');
    fireEvent.changeText(screen.getByTestId('transfer-search'), 'sada');
    fireEvent.press(screen.getByTestId('team-suggestion-1'));

    expect(screen.getByTestId('selected-team')).toBeTruthy();
    expect(screen.getByTestId('transfers-section-Chegaram')).toHaveTextContent(
      /Chegaram.*· 1/,
    );
    expect(screen.getByTestId('transfers-section-Saíram')).toHaveTextContent(
      /Saíram.*· 1/,
    );
    expect(screen.queryByTestId('transfer-card-t2')).toBeNull();

    fireEvent.press(screen.getByTestId('clear-team'));
    expect(screen.getByTestId('transfer-card-t2')).toBeTruthy();
  });

  it('filters by athlete without suggesting teams', async () => {
    render(<TransfersScreen />);
    await screen.findByTestId('transfer-card-t1');
    fireEvent.changeText(screen.getByTestId('transfer-search'), 'bruno');
    expect(screen.queryByText('Times')).toBeNull();
    expect(screen.getByTestId('transfer-card-t2')).toBeTruthy();
    expect(screen.queryByTestId('transfer-card-t1')).toBeNull();
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
  it('picks and removes a favorite from the team sheet', async () => {
    render(<SettingsScreen />);
    fireEvent.press(await screen.findByTestId('pick-team-masculina'));
    fireEvent.press(await screen.findByTestId('team-option-1'));
    await waitFor(() =>
      expect(saveFavorite).toHaveBeenCalledWith('masculina', '1'),
    );
    expect(
      await screen.findByLabelText(/Seu time em Superliga Masculina/),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('pick-team-masculina'));
    fireEvent.press(await screen.findByTestId('team-none'));
    await waitFor(() =>
      expect(deleteFavorite).toHaveBeenCalledWith('masculina'),
    );
  });

  it('stops following a competition, but never the last one', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key) =>
      key === '@followed_competitions' ? '["masculina","nfl"]' : null,
    );
    render(<SettingsScreen />);
    await waitFor(() =>
      expect(screen.queryByTestId('pick-team-feminina')).toBeNull(),
    );
    // The NFL is the only competition of its sport: its switch is the sport's.
    fireEvent(
      screen.getByTestId('follow-sport-futebol-americano'),
      'valueChange',
      false,
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@followed_competitions',
      JSON.stringify(['masculina']),
    );
    await waitFor(() =>
      expect(screen.getByTestId('follow-sport-volei').props.disabled).toBe(
        true,
      ),
    );
    expect(
      screen.getByTestId('follow-masculina').props.accessibilityState.disabled,
    ).toBe(true);
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async () => null);
  });
});

describe('SettingsScreen search and theme', () => {
  it('finds a team ignoring case and accents', async () => {
    (getTeams as jest.Mock).mockResolvedValue([
      homeTeam,
      { ...awayTeam, name: 'VÔLEI RENATA' },
    ]);
    render(<SettingsScreen />);
    fireEvent.press(await screen.findByTestId('pick-team-masculina'));
    await screen.findByTestId('team-option-2');
    fireEvent.changeText(screen.getByTestId('team-search'), 'volei');
    await waitFor(() =>
      expect(screen.queryByTestId('team-option-1')).toBeNull(),
    );
    expect(screen.getByTestId('team-option-2')).toBeTruthy();
  });

  it('says when no team matches', async () => {
    render(<SettingsScreen />);
    fireEvent.press(await screen.findByTestId('pick-team-masculina'));
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
    expect(screen.getByTestId('set-scores')).toBeTruthy();
    expect(screen.getByLabelText(/^Sada Cruzeiro, 1º set: 25,/)).toBeTruthy();
    fireEvent.press(screen.getByText('Assistir no SporTV 2'));
    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining('globoplay'),
    );
  });

  it('shows the score by half and the goals and red cards of a football match', async () => {
    (getMatch as jest.Mock).mockResolvedValue({
      ...finishedMatch,
      competition: 'serie-a',
      homeScore: 2,
      awayScore: 1,
      setScores: [],
      events: [
        {
          type: 'goal',
          side: 'away',
          player: 'Vargas',
          period: '1T',
          minute: 10,
        },
        {
          type: 'own-goal',
          side: 'home',
          player: 'Léo',
          period: '1T',
          minute: 26,
        },
        {
          type: 'red-card',
          side: 'away',
          player: 'Zagueiro',
          period: '2T',
          minute: 48,
        },
        {
          type: 'goal',
          side: 'home',
          player: 'Jorginho',
          period: '2T',
          minute: 50,
        },
      ],
    });
    render(<MatchDetailScreen />);
    expect(await screen.findByText('2 x 1')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Sada Cruzeiro, 1º tempo: 1, 2º tempo: 1, final: 2',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Léo (contra)')).toBeTruthy();
    expect(screen.getByText("45+3'")).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Cartão vermelho para Zagueiro, Vôlei Renata, aos 45 mais 3 minutos do 2º tempo',
      ),
    ).toBeTruthy();
  });

  it('shows no timeline for a match without collected events', async () => {
    (getMatch as jest.Mock).mockResolvedValue({
      ...finishedMatch,
      competition: 'serie-a',
      setScores: [],
    });
    render(<MatchDetailScreen />);
    expect(await screen.findByText('3 x 1')).toBeTruthy();
    expect(screen.queryByTestId('match-timeline')).toBeNull();
    expect(screen.queryByTestId('half-scores')).toBeNull();
  });

  it('shows the quarter scores of a basketball game', async () => {
    (getMatch as jest.Mock).mockResolvedValue({
      ...finishedMatch,
      competition: 'nba',
      homeScore: 97,
      awayScore: 96,
      setScores: [],
      periodScores: [
        { home: 20, away: 24 },
        { home: 25, away: 26 },
        { home: 30, away: 20 },
        { home: 22, away: 26 },
      ],
    });
    render(<MatchDetailScreen />);
    expect(await screen.findByText('97 x 96')).toBeTruthy();
    expect(screen.getByTestId('quarter-scores')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Sada Cruzeiro, 1º quarto: 20, 2º quarto: 25, 3º quarto: 30, 4º quarto: 22, final: 97',
      ),
    ).toBeTruthy();
  });

  it('labels the running total of a live game as Total', async () => {
    (getMatch as jest.Mock).mockResolvedValue({
      ...finishedMatch,
      competition: 'nfl',
      status: 'live',
      homeScore: 3,
      awayScore: 17,
      setScores: [],
      periodScores: [
        { home: 3, away: 3 },
        { home: 0, away: 14 },
      ],
    });
    render(<MatchDetailScreen />);
    expect(
      await screen.findByLabelText(
        'Sada Cruzeiro, 1º quarto: 3, 2º quarto: 0, total: 3',
      ),
    ).toBeTruthy();
  });

  it('hides "Onde assistir" for a started game without a channel', async () => {
    (getMatch as jest.Mock).mockResolvedValue({
      ...finishedMatch,
      channels: [],
    });
    render(<MatchDetailScreen />);
    expect(await screen.findByText('3 x 1')).toBeTruthy();
    expect(screen.queryByText('Onde assistir')).toBeNull();
    expect(screen.queryByText('Transmissão a definir')).toBeNull();
  });

  it('keeps "Transmissão a definir" before kickoff', async () => {
    (getMatch as jest.Mock).mockResolvedValue({
      ...finishedMatch,
      status: 'scheduled',
      homeScore: null,
      awayScore: null,
      setScores: [],
      channels: [],
    });
    render(<MatchDetailScreen />);
    expect(await screen.findByText('Transmissão a definir')).toBeTruthy();
  });

  it('handles an unknown match', async () => {
    (getMatch as jest.Mock).mockResolvedValue(null);
    render(<MatchDetailScreen />);
    expect(await screen.findByText('Jogo não encontrado')).toBeTruthy();
  });
});
