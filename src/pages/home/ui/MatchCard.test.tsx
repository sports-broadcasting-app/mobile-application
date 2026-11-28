import { fireEvent, render, screen } from '@/test/utils';
import * as Linking from 'expo-linking';
import { MatchCard } from './MatchCard';
import {
  awayTeam,
  finishedMatch,
  homeTeam,
  scheduledMatch,
} from '@/test/fixtures';

jest.mock('@/shared/api/database', () => ({
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

  it('says the channel is unknown only before kickoff', async () => {
    render(
      <MatchCard
        match={{ ...scheduledMatch, channels: [] }}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />,
    );
    expect(
      await screen.findByText('Transmissão a definir', {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
  });

  it('shows nothing about the channel of a live game and flags favorites', async () => {
    render(
      <MatchCard
        match={{ ...scheduledMatch, channels: [], status: 'live' }}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        favorite
      />,
    );
    expect(await screen.findByText('AO VIVO')).toBeTruthy();
    expect(
      screen.queryByText('Transmissão a definir', {
        includeHiddenElements: true,
      }),
    ).toBeNull();
    expect(screen.getByTestId('favorite-star')).toBeTruthy();
  });

  it('says a finished game without a channel is over', async () => {
    render(
      <MatchCard
        match={{ ...finishedMatch, channels: [] }}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />,
    );
    expect(
      await screen.findByText('Jogo encerrado', {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(
      screen.queryByText('Transmissão a definir', {
        includeHiddenElements: true,
      }),
    ).toBeNull();
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
    expect(
      screen.getByText('Passa na TV Cultura', { includeHiddenElements: true }),
    ).toBeTruthy();
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

  it('reads as one sentence and opens the match from the screen reader', async () => {
    const onPress = jest.fn();
    render(
      <MatchCard
        match={scheduledMatch}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        onPress={onPress}
      />,
    );
    const summary = await screen.findByLabelText(
      'Sada Cruzeiro contra Vôlei Renata, 20:30, Superliga M, 3ª rodada, passa no GE TV',
    );
    expect(summary.props.accessibilityRole).toBe('button');
    fireEvent(summary, 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });
    expect(onPress).toHaveBeenCalled();
    // The watch button stays its own element.
    expect(screen.getByRole('button', { name: 'Abrir no GE TV' })).toBeTruthy();
  });
});
