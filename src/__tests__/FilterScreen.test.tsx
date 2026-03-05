import { render, screen, fireEvent } from '../test-utils';
import { FilterScreen } from '../screens/FilterScreen';
import * as matchService from '../services/matchService';
import { DailySchedule } from '../types/match';

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
      scoreUrl: '',
    },
  ],
};

describe('FilterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue(mockSchedule);
  });

  it('renders section titles', () => {
    render(<FilterScreen />);

    expect(screen.getByText('Esporte')).toBeTruthy();
    expect(screen.getByText('Competicao')).toBeTruthy();
    expect(screen.getByText('Plataforma')).toBeTruthy();
  });

  it('renders sport chips', () => {
    render(<FilterScreen />);

    expect(screen.getByText('Futebol')).toBeTruthy();
    expect(screen.getByText('Volei')).toBeTruthy();
    expect(screen.getByText('Formula 1')).toBeTruthy();
  });

  it('renders disabled sport chips', () => {
    render(<FilterScreen />);

    expect(screen.getByText('Basquete (Em breve)')).toBeTruthy();
    expect(screen.getByText('MMA (Em breve)')).toBeTruthy();
  });

  it('renders APLICAR FILTROS button', () => {
    render(<FilterScreen />);

    expect(screen.getByText('APLICAR FILTROS')).toBeTruthy();
  });

  it('calls onApply when button is pressed', () => {
    const onApply = jest.fn();
    render(<FilterScreen onApply={onApply} />);

    fireEvent.press(screen.getByText('APLICAR FILTROS'));

    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('toggles sport chip selection', () => {
    render(<FilterScreen />);

    fireEvent.press(screen.getByTestId('filter-sport-football'));
    fireEvent.press(screen.getByTestId('filter-sport-football'));
  });
});
