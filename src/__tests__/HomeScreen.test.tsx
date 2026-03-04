import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import HomeTabScreen from '../../app/(tabs)/index';
import * as matchService from '../services/matchService';
import { DailySchedule } from '../types/match';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  Stack: { Screen: () => null },
}));

jest.mock('../services/matchService');

const mockFetch = matchService.fetchTodayMatches as jest.MockedFunction<
  typeof matchService.fetchTodayMatches
>;

const mockSchedule: DailySchedule = {
  date: '2026-03-04',
  crawledAt: '2026-03-04T06:00:00.000Z',
  matches: [
    {
      id: '100',
      sport: 'football',
      championship: { id: 12, slug: 'ingles', phase: 'Primeira Fase' },
      homeTeam: {
        id: 1,
        name: 'Liverpool',
        acronym: 'LFC',
        slug: 'liverpool',
      },
      awayTeam: {
        id: 2,
        name: 'Chelsea',
        acronym: 'CHE',
        slug: 'chelsea',
      },
      isoDate: '2026-03-04T17:00:00.000Z',
      date: '2026-03-04',
      hour: '17h00',
      stadium: 'Anfield',
      location: { city: 'Liverpool', state: '', country: 'Inglaterra' },
      status: 'match-not-started',
      result: null,
      round: 29,
      score: {
        type: 'football',
        goals: { home: null, away: null },
        penalties: { home: null, away: null },
      },
      broadcast: [{ name: 'ESPN', url: '' }],
      scoreUrl: 'https://example.com/test.htm',
    },
  ],
};

describe('HomeTabScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<HomeTabScreen />);

    expect(screen.getByText('Onde Assistir')).toBeTruthy();
  });

  it('renders sport chips', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<HomeTabScreen />);

    expect(screen.getByText('Futebol')).toBeTruthy();
    expect(screen.getByText('Volei')).toBeTruthy();
  });

  it('renders "Em Destaque Hoje" section', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<HomeTabScreen />);

    expect(screen.getByText('Em Destaque Hoje')).toBeTruthy();
  });

  it('renders search bar', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<HomeTabScreen />);

    expect(screen.getByTestId('search-input')).toBeTruthy();
  });

  it('navigates to championship when sport chip is pressed', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<HomeTabScreen />);

    fireEvent.press(screen.getByTestId('sport-card-football'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/championship/[sport]',
      params: { sport: 'football' },
    });
  });

  it('renders highlighted matches after loading', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<HomeTabScreen />);

    await waitFor(() => {
      expect(screen.getByText('Liverpool')).toBeTruthy();
      expect(screen.getByText('Chelsea')).toBeTruthy();
    });
  });

  it('navigates to match detail when match card is pressed', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<HomeTabScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('match-card-100')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('match-card-100'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/match/[id]',
      params: { id: '100', sport: 'football' },
    });
  });

  it('shows loading state', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<HomeTabScreen />);

    expect(screen.getByText('Carregando jogos...')).toBeTruthy();
  });

  it('shows error state', async () => {
    mockFetch.mockRejectedValue(new Error('API error: 503'));
    render(<HomeTabScreen />);

    await waitFor(() => {
      expect(screen.getByText('API error: 503')).toBeTruthy();
    });

    expect(screen.getByText('Tentar novamente')).toBeTruthy();
  });
});
