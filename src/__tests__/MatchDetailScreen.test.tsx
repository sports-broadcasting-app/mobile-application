import { render, screen, waitFor } from '../test-utils';
import MatchDetailScreen from '../../app/match/[id]';
import * as matchService from '../services/matchService';
import { DailySchedule } from '../types/match';

let mockParams = { id: '100', sport: 'football' };
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: mockBack }),
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

const mockF1Schedule: DailySchedule = {
  date: '2026-03-08',
  crawledAt: '2026-03-08T06:00:00.000Z',
  matches: [
    {
      id: 'f1-race',
      sport: 'formula1',
      championship: { id: 50, slug: 'formula1', phase: '' },
      eventName: 'Australian Grand Prix',
      sessionType: 'race',
      sessionLabel: 'Corrida',
      isoDate: '2026-03-08T01:00:00.000Z',
      date: '2026-03-08',
      hour: '01h00',
      stadium: 'Albert Park',
      location: { city: 'Melbourne', state: '', country: 'Australia' },
      status: 'match-not-started',
      result: null,
      round: null,
      broadcast: [
        { name: 'Band', url: '' },
        { name: 'F1 TV Pro', url: '' },
      ],
      scoreUrl: '',
    },
  ],
};

describe('MatchDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { id: '100', sport: 'football' };
  });

  it('shows loading state', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<MatchDetailScreen />);

    expect(screen.getByTestId('skeleton-loading')).toBeTruthy();
  });

  it('renders team names and circles', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Liverpool vs Chelsea')).toBeTruthy();
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

  it('renders VS badge for not-started match', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('vs-badge').length).toBeGreaterThanOrEqual(
        1,
      );
    });
  });

  it('renders countdown timer', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('countdown-timer')).toBeTruthy();
    });
  });

  it('renders ASSISTIR AGORA button', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('ASSISTIR AGORA')).toBeTruthy();
    });
  });

  it('renders championship label', async () => {
    mockFetch.mockResolvedValue(mockSchedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Ingles')).toBeTruthy();
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

  it('renders F1 event name, session label, and circuit', async () => {
    mockParams = { id: 'f1-race', sport: 'formula1' };
    mockFetch.mockResolvedValue(mockF1Schedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Australian Grand Prix')).toBeTruthy();
      expect(screen.getByText('Corrida')).toBeTruthy();
      expect(
        screen.getByText('Albert Park - Melbourne, Australia'),
      ).toBeTruthy();
    });
  });

  it('does not render team circles for F1', async () => {
    mockParams = { id: 'f1-race', sport: 'formula1' };
    mockFetch.mockResolvedValue(mockF1Schedule);
    render(<MatchDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Australian Grand Prix')).toBeTruthy();
    });

    expect(screen.queryByTestId('team-circle-liverpool')).toBeNull();
    expect(screen.queryByTestId('team-circle-chelsea')).toBeNull();
  });
});
