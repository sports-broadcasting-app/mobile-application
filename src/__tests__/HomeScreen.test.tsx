import { render, screen, fireEvent, waitFor } from '../test-utils';
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

  it('renders OndeVer branding', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<HomeTabScreen />);

    expect(screen.getByText('OndeVer')).toBeTruthy();
  });

  it('renders sport chips', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<HomeTabScreen />);

    expect(screen.getByText('Futebol')).toBeTruthy();
    expect(screen.getByText('Volei')).toBeTruthy();
  });

  it('renders "Jogos do Dia" section', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<HomeTabScreen />);

    expect(screen.getByText('Jogos do Dia')).toBeTruthy();
  });

  it('filters matches when sport chip is pressed', async () => {
    const scheduleWithVolleyball: DailySchedule = {
      ...mockSchedule,
      matches: [
        ...mockSchedule.matches,
        {
          id: '200',
          sport: 'volleyball',
          championship: {
            id: 20,
            slug: 'superliga',
            phase: 'Primeira Fase',
          },
          homeTeam: {
            id: 10,
            name: 'Sada Cruzeiro',
            acronym: 'CRU',
            slug: 'cruzeiro-volei',
          },
          awayTeam: {
            id: 11,
            name: 'Taubate',
            acronym: 'TAU',
            slug: 'taubate',
          },
          isoDate: '2026-03-04T19:00:00.000Z',
          date: '2026-03-04',
          hour: '19h00',
          stadium: 'Ginasio',
          location: { city: 'BH', state: 'MG', country: 'Brasil' },
          status: 'match-not-started',
          result: null,
          round: 10,
          score: {
            type: 'volleyball',
            sets: { home: null, away: null },
            setScores: [],
          },
          broadcast: [{ name: 'SporTV', url: '' }],
          scoreUrl: '',
        },
      ],
    };
    mockFetch.mockResolvedValue(scheduleWithVolleyball);
    render(<HomeTabScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('match-card-100')).toBeTruthy();
      expect(screen.getByTestId('match-card-200')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('sport-chip-football'));

    expect(screen.getByTestId('match-card-100')).toBeTruthy();
    expect(screen.queryByTestId('match-card-200')).toBeNull();
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

  it('renders Formula 1 chip', () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<HomeTabScreen />);

    expect(screen.getByText('Formula 1')).toBeTruthy();
  });
});
