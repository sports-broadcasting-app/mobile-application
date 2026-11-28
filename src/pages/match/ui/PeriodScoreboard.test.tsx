import { render, screen } from '@/test/utils';
import { PeriodScoreboard } from './PeriodScoreboard';
import { awayTeam, homeTeam } from '@/test/fixtures';

jest.mock('@/shared/api/database', () => ({
  getFavorites: jest.fn(async () => ({})),
}));

describe('PeriodScoreboard', () => {
  it('shows each period and the total per team, read as one row', async () => {
    render(
      <PeriodScoreboard
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        periods={[
          { label: '1º', name: '1º set', home: 23, away: 25 },
          { label: '2º', name: '2º set', home: 25, away: 9 },
        ]}
        totalLabel="Sets"
        homeTotal={1}
        awayTotal={1}
      />,
    );
    expect(
      await screen.findByLabelText(
        'Sada Cruzeiro, 1º set: 23, 2º set: 25, sets: 1',
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText('Vôlei Renata, 1º set: 25, 2º set: 9, sets: 1'),
    ).toBeTruthy();
    // The column headers are visual only.
    expect(screen.queryByText('1º')).toBeNull();
    expect(
      screen.getByText('1º', { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});
