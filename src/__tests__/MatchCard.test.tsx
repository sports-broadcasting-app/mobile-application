import { render, screen } from '@testing-library/react-native';
import { MatchCard } from '../components/MatchCard';
import { Match } from '../types/match';

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: '1',
  sport: 'football',
  championship: { id: 12, slug: 'ingles', phase: 'Primeira Fase' },
  homeTeam: { id: 1, name: 'Liverpool', acronym: 'LFC', slug: 'liverpool' },
  awayTeam: {
    id: 2,
    name: 'Wolverhampton',
    acronym: 'WOL',
    slug: 'wolverhampton',
  },
  isoDate: '2026-03-03T17:15:00.000Z',
  date: '2026-03-03',
  hour: '17h15',
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
    { name: 'Disney+', url: '' },
  ],
  scoreUrl:
    'https://placar.uol.com.br/esporte/futebol/ingles/2026/03/03/test.htm',
  ...overrides,
});

describe('MatchCard', () => {
  it('renders team names', () => {
    render(<MatchCard match={makeMatch()} />);

    expect(screen.getByText('Liverpool')).toBeTruthy();
    expect(screen.getByText('Wolverhampton')).toBeTruthy();
  });

  it('renders match time', () => {
    render(<MatchCard match={makeMatch()} />);

    expect(screen.getByText('17h15')).toBeTruthy();
  });

  it('renders championship slug', () => {
    render(<MatchCard match={makeMatch()} />);

    expect(screen.getByText('ingles')).toBeTruthy();
  });

  it('renders broadcast channels', () => {
    render(<MatchCard match={makeMatch()} />);

    expect(screen.getByText('ESPN, Disney+')).toBeTruthy();
  });

  it('renders fallback when no broadcast', () => {
    render(<MatchCard match={makeMatch({ broadcast: [] })} />);

    expect(screen.getByText('Transmissao nao definida')).toBeTruthy();
  });

  it('renders "x" separator when match not started', () => {
    render(<MatchCard match={makeMatch()} />);

    expect(screen.getByText('x')).toBeTruthy();
  });

  it('renders football score when match has started', () => {
    render(
      <MatchCard
        match={makeMatch({
          status: 'match-live',
          score: {
            type: 'football',
            goals: { home: 2, away: 1 },
            penalties: { home: null, away: null },
          },
        })}
      />,
    );

    expect(screen.getByText('2 x 1')).toBeTruthy();
  });

  it('renders football penalties when present', () => {
    render(
      <MatchCard
        match={makeMatch({
          status: 'match-ended',
          score: {
            type: 'football',
            goals: { home: 1, away: 1 },
            penalties: { home: 4, away: 3 },
          },
        })}
      />,
    );

    expect(screen.getByText('Penaltis: 4 x 3')).toBeTruthy();
  });

  it('renders volleyball score with sets', () => {
    render(
      <MatchCard
        match={makeMatch({
          sport: 'volleyball',
          status: 'match-ended',
          score: {
            type: 'volleyball',
            sets: { home: 3, away: 1 },
            setScores: [
              { home: 25, away: 20 },
              { home: 22, away: 25 },
              { home: 25, away: 18 },
              { home: 25, away: 21 },
            ],
          },
        })}
      />,
    );

    expect(screen.getByText('3 x 1')).toBeTruthy();
    expect(screen.getByText('25-20 / 22-25 / 25-18 / 25-21')).toBeTruthy();
  });
});
