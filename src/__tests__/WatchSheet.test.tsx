import * as Linking from 'expo-linking';
import { fireEvent, render, screen } from '../test-utils';
import { WatchSheet } from '../components/WatchSheet';
import { awayTeam, homeTeam, scheduledMatch } from '../test-fixtures';

jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
}));

describe('WatchSheet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders nothing while there is no match', () => {
    render(
      <WatchSheet match={null} onClose={jest.fn()} onDetails={jest.fn()} />,
    );
    expect(screen.queryByTestId('watch-details')).toBeNull();
  });

  it('offers to open the broadcaster app and closes the sheet', () => {
    const onClose = jest.fn();
    render(
      <WatchSheet
        match={scheduledMatch}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        onClose={onClose}
        onDetails={jest.fn()}
      />,
    );
    expect(screen.getByText('Abrir GE TV')).toBeTruthy();
    fireEvent.press(screen.getByTestId('watch-open-GE TV'));
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://www.youtube.com/@getv',
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('explains when a channel has no app to open', () => {
    render(
      <WatchSheet
        match={{ ...scheduledMatch, channels: ['TV Cultura'] }}
        onClose={jest.fn()}
        onDetails={jest.fn()}
      />,
    );
    expect(screen.getByText('Este jogo passa em TV Cultura.')).toBeTruthy();
    expect(screen.getByText('TV Cultura (sem app)')).toBeTruthy();
    expect(screen.queryByTestId('watch-open-TV Cultura')).toBeNull();
  });

  it('says when the broadcast is still undefined', () => {
    render(
      <WatchSheet
        match={{ ...scheduledMatch, channels: [] }}
        onClose={jest.fn()}
        onDetails={jest.fn()}
      />,
    );
    expect(
      screen.getByText('A transmissão deste jogo ainda não foi definida.'),
    ).toBeTruthy();
  });

  it('hands the match to onDetails and closes on cancel', () => {
    const onDetails = jest.fn();
    const onClose = jest.fn();
    render(
      <WatchSheet
        match={scheduledMatch}
        onClose={onClose}
        onDetails={onDetails}
      />,
    );
    fireEvent.press(screen.getByTestId('watch-details'));
    expect(onDetails).toHaveBeenCalledWith(scheduledMatch);
    fireEvent.press(screen.getByTestId('watch-cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
