import { render, screen, waitFor } from '@testing-library/react-native';
import MatchDetailScreen from '../../app/match/[id]';
import * as matchService from '../services/matchService';
import { DailySchedule } from '../types/match';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '100', sport: 'football' }),
  Stack: { Screen: () => null },
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn(),
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
      broadcast: [
        { name: 'ESPN', url: '' },
        { name: 'Disney+', url: 'https://disneyplus.com' },
      ],
      scoreUrl: 'https://example.com/test.htm',
    },
    {
      id: '200',
      sport: 'football',
      championship: { id: 12, slug: 'ingles', phase: 'Primeira Fase' },
      homeTeam: {
        id: 3,
        name: 'Arsenal',
        acronym: 'ARS',
        slug: 'arsenal',
      },
      awayTeam: {
        id: 4,
        name: 'Man City',
        acronym: 'MCI',
        slug: 'man-city',
      },
      isoDate: '2026-03-04T19:00:00.000Z',
      date: '2026-03-04',
      hour: '19h00',
      stadium: 'Emirates',
      location: { city: 'London', state: '', country: 'Inglaterra' },
      status: 'match-not-started',
      result: null,
      round: 29,
      score: {
        type: 'football',
        goals: { home: null, away: null },
        penalties: { home: null, away: null },
      },
      broadcast: [{ name: 'ESPN', url: '' }],
      scoreUrl: 'https://example.com/test2.htm',
    },
  ],
};

describe('MatchDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<MatchDetailScreen />);

    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });

  it('renders team names and circles', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Liverpool')).toBeTruthy();
      expect(screen.getByText('Chelsea')).toBeTruthy();
      expect(screen.getByTestId('team-circle-liverpool')).toBeTruthy();
      expect(screen.getByTestId('team-circle-chelsea')).toBeTruthy();
    });
  });

  it('renders team acronyms in circles', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('LFC')).toBeTruthy();
      expect(screen.getByText('CHE')).toBeTruthy();
    });
  });

  it('renders broadcast cards', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Onde Assistir')).toBeTruthy();
      expect(screen.getByTestId('broadcast-card-ESPN')).toBeTruthy();
      expect(screen.getByTestId('broadcast-card-Disney+')).toBeTruthy();
    });
  });

  it('shows "Assistir na TV" for broadcasts without URL', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Assistir na TV')).toBeTruthy();
    });
  });

  it('shows "Abrir no App" for broadcasts with URL', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Abrir no App')).toBeTruthy();
    });
  });

  it('renders related matches from same championship', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Proximos Jogos')).toBeTruthy();
      expect(screen.getByText('Arsenal')).toBeTruthy();
      expect(screen.getByText('Man City')).toBeTruthy();
    });
  });

  it('renders stadium info', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Anfield - Liverpool')).toBeTruthy();
    });
  });

  it('shows error when match not found', async () => {
    mockFetch.mockResolvedValue({
      date: '2026-03-04',
      crawledAt: '2026-03-04T06:00:00.000Z',
      matches: [],
    });
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Jogo nao encontrado')).toBeTruthy();
    });
  });
});
