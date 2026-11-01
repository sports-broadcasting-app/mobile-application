import { render, screen } from '../test-utils';
import { TeamCircle } from '../components/TeamCircle';
import { homeTeam } from '../test-fixtures';

jest.mock('../data/database', () => ({
  getFavorites: jest.fn(async () => ({})),
}));

describe('TeamCircle', () => {
  it('shows the code when there is no badge', async () => {
    render(<TeamCircle team={homeTeam} />);
    expect(await screen.findByText('SAD')).toBeTruthy();
  });

  it('shows the badge when available', async () => {
    render(<TeamCircle team={{ ...homeTeam, badgeUrl: 'https://x.com/a' }} />);
    expect(await screen.findByTestId('team-logo-1')).toBeTruthy();
  });
});
