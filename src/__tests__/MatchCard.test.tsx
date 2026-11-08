import { fireEvent, render, screen } from '../test-utils';
import { MatchCard } from '../components/MatchCard';
import {
  awayTeam,
  finishedMatch,
  homeTeam,
  scheduledMatch,
} from '../test-fixtures';

jest.mock('../data/database', () => ({
  getFavorites: jest.fn(async () => ({})),
}));

describe('MatchCard', () => {
  it('shows local time, teams and channel', async () => {
    render(
      <MatchCard
        match={scheduledMatch}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />,
    );
    expect(await screen.findByText('20:30 · Masculina')).toBeTruthy();
    expect(screen.getByText('Sada Cruzeiro')).toBeTruthy();
    expect(screen.getByText('GE TV')).toBeTruthy();
  });

  it('shows the score of a finished match', async () => {
    render(
      <MatchCard
        match={finishedMatch}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />,
    );
    expect(await screen.findByText('3')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('warns when the channel is unknown and flags live favorites', async () => {
    render(
      <MatchCard
        match={{ ...scheduledMatch, channels: [], status: 'live' }}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        favorite
      />,
    );
    expect(await screen.findByText('Transmissão a definir')).toBeTruthy();
    expect(screen.getByText('AO VIVO')).toBeTruthy();
    expect(screen.getByTestId('favorite-star')).toBeTruthy();
  });

  it('calls onPress', async () => {
    const onPress = jest.fn();
    render(
      <MatchCard
        match={scheduledMatch}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        onPress={onPress}
      />,
    );
    fireEvent.press(await screen.findByTestId('match-card-100'));
    expect(onPress).toHaveBeenCalled();
  });
});
