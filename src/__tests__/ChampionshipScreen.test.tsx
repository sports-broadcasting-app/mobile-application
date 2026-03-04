import {
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react-native';
import ChampionshipScreen from '../../app/championship/[sport]';
import * as matchService from '../services/matchService';
import { DailySchedule } from '../types/match';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ sport: 'football' }),
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
    {
      id: '200',
      sport: 'football',
      championship: { id: 20, slug: 'brasileiro', phase: 'Primeira Fase' },
      homeTeam: {
        id: 3,
        name: 'Flamengo',
        acronym: 'FLA',
        slug: 'flamengo',
      },
      awayTeam: {
        id: 4,
        name: 'Palmeiras',
        acronym: 'PAL',
        slug: 'palmeiras',
      },
      isoDate: '2026-03-04T21:00:00.000Z',
      date: '2026-03-04',
      hour: '21h00',
      stadium: 'Maracana',
      location: {
        city: 'Rio de Janeiro',
        state: 'RJ',
        country: 'Brasil',
      },
      status: 'match-not-started',
      result: null,
      round: 1,
      score: {
        type: 'football',
        goals: { home: null, away: null },
        penalties: { home: null, away: null },
      },
      broadcast: [{ name: 'Globo', url: '' }],
      scoreUrl: 'https://example.com/test2.htm',
    },
  ],
};

describe('ChampionshipScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<ChampionshipScreen />);

    expect(screen.getByText('Carregando campeonatos...')).toBeTruthy();
  });

  it('renders championship list after loading', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<ChampionshipScreen />);

    await waitFor(() => {
      expect(screen.getByText('Brasileiro')).toBeTruthy();
      expect(screen.getByText('Ingles')).toBeTruthy();
    });
  });

  it('does not render "Todos os campeonatos"', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<ChampionshipScreen />);

    await waitFor(() => {
      expect(screen.getByText('Brasileiro')).toBeTruthy();
    });

    expect(screen.queryByText('Todos os campeonatos')).toBeNull();
  });

  it('navigates to matches with championship when selected', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<ChampionshipScreen />);

    await waitFor(() => {
      expect(screen.getByText('Brasileiro')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('championship-card-brasileiro'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/matches/[sport]',
      params: { sport: 'football', championship: 'brasileiro' },
    });
  });

  it('shows error message on failure', async () => {
    mockFetch.mockRejectedValue(new Error('API error: 503'));
    render(<ChampionshipScreen />);

    await waitFor(() => {
      expect(screen.getByText('API error: 503')).toBeTruthy();
    });

    expect(screen.getByText('Tentar novamente')).toBeTruthy();
  });
});
