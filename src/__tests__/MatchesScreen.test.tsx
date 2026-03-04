import { render, screen, waitFor } from '@testing-library/react-native';
import MatchesScreen from '../../app/matches/[sport]';
import * as matchService from '../services/matchService';
import { DailySchedule } from '../types/match';

let mockParams: Record<string, string | undefined> = {};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: jest.fn() }),
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
      location: { city: 'Rio de Janeiro', state: 'RJ', country: 'Brasil' },
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

describe('MatchesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { sport: 'football' };
  });

  it('shows loading indicator initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<MatchesScreen />);

    expect(screen.getByText('Carregando jogos...')).toBeTruthy();
  });

  it('renders all matches when no championship filter', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchesScreen />);

    await waitFor(() => {
      expect(screen.getByText('Liverpool')).toBeTruthy();
      expect(screen.getByText('Flamengo')).toBeTruthy();
    });
  });

  it('filters matches by championship', async () => {
    mockParams = { sport: 'football', championship: 'brasileiro' };
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchesScreen />);

    await waitFor(() => {
      expect(screen.getByText('Flamengo')).toBeTruthy();
    });

    expect(screen.queryByText('Liverpool')).toBeNull();
  });

  it('shows empty state when no matches', async () => {
    mockFetch.mockResolvedValue({
      date: '2026-03-04',
      crawledAt: '2026-03-04T06:00:00.000Z',
      matches: [],
    });
    render(<MatchesScreen />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum jogo encontrado')).toBeTruthy();
    });
  });

  it('shows error message on failure', async () => {
    mockFetch.mockRejectedValue(new Error('API error: 503'));
    render(<MatchesScreen />);

    await waitFor(() => {
      expect(screen.getByText('API error: 503')).toBeTruthy();
    });

    expect(screen.getByText('Tentar novamente')).toBeTruthy();
  });
});
