import { fireEvent, render, screen } from '../test-utils';
import { MatchRow } from '../components/MatchRow';
import { awayTeam, homeTeam, scheduledMatch } from '../test-fixtures';

jest.mock('../data/database', () => ({
  getFavorites: jest.fn(async () => ({})),
}));

describe('MatchRow', () => {
  it('shows day, time, clubs and the first channel in one line', async () => {
    const onPress = jest.fn();
    render(
      <MatchRow
        match={scheduledMatch}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        onPress={onPress}
      />,
    );
    expect(await screen.findByText('dom 01/11 · 20:30')).toBeTruthy();
    expect(screen.getByText('Sada Cruzeiro × Vôlei Renata')).toBeTruthy();
    expect(screen.getByText('GE TV')).toBeTruthy();
    fireEvent.press(screen.getByTestId('match-row-100'));
    expect(onPress).toHaveBeenCalled();
  });

  it('says when the broadcaster is still unknown', async () => {
    render(
      <MatchRow
        match={{ ...scheduledMatch, channels: [] }}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />,
    );
    expect(await screen.findByText('a definir')).toBeTruthy();
  });
});
