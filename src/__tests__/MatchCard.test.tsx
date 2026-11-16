import { fireEvent, render, screen } from '../test-utils';
import * as Linking from 'expo-linking';
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
jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
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
    expect(
      await screen.findByText('20:30 · Superliga M · 3ª rodada'),
    ).toBeTruthy();
    expect(screen.getByText('Sada Cruzeiro')).toBeTruthy();
    expect(screen.getByText('Abrir no GE TV')).toBeTruthy();
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
    expect(screen.getByText('Abrir no SporTV 2')).toBeTruthy();
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

  it('names the live channel as a call to watch and opens its app', async () => {
    render(
      <MatchCard
        match={{
          ...scheduledMatch,
          status: 'live',
          channels: ['GE TV', 'TV Cultura'],
        }}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />,
    );
    fireEvent.press(await screen.findByText('Assistir no GE TV'));
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://www.youtube.com/@getv',
    );
    expect(screen.getByText('Passa na TV Cultura')).toBeTruthy();
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
