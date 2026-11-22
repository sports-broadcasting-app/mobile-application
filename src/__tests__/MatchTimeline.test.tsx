import { render, screen } from '../test-utils';
import { MatchTimeline } from '../components/MatchTimeline';
import { awayTeam, homeTeam } from '../test-fixtures';

jest.mock('../data/database', () => ({
  getFavorites: jest.fn(async () => ({})),
}));

describe('MatchTimeline', () => {
  it('lists goals and red cards by half, marking own goals', async () => {
    render(
      <MatchTimeline
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        events={[
          {
            type: 'goal',
            side: 'home',
            player: 'Darlan',
            period: '1T',
            minute: 12,
          },
          {
            type: 'own-goal',
            side: 'away',
            player: 'Lucão',
            period: '2T',
            minute: 3,
          },
          {
            type: 'red-card',
            side: 'home',
            player: 'Isac',
            period: '2T',
            minute: 47,
          },
        ]}
      />,
    );
    expect(await screen.findByText('1º tempo')).toBeTruthy();
    expect(screen.getByText('2º tempo')).toBeTruthy();
    expect(screen.getByText("12'")).toBeTruthy();
    expect(screen.getByText('Lucão (contra)')).toBeTruthy();
    expect(screen.getByText("45+2'")).toBeTruthy();
    expect(screen.getByTestId('red-card-icon')).toBeTruthy();
  });

  it('says when a half had nothing', async () => {
    render(
      <MatchTimeline
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        events={[
          { type: 'goal', side: 'away', player: 'X', period: '2T', minute: 30 },
        ]}
      />,
    );
    expect(await screen.findByText('Sem gols nem expulsões')).toBeTruthy();
  });
});
