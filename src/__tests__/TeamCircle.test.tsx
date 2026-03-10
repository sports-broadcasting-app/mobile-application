import { render, screen } from '@testing-library/react-native';
import { TeamCircle } from '../components/TeamCircle';
import { Team } from '../types/match';

const baseTeam: Team = {
  id: 1,
  name: 'Liverpool',
  acronym: 'LFC',
  slug: 'liverpool',
};

describe('TeamCircle', () => {
  it('renders acronym when no logoUrl', () => {
    render(<TeamCircle team={baseTeam} />);

    expect(screen.getByTestId('team-circle-liverpool')).toBeTruthy();
    expect(screen.getByText('LFC')).toBeTruthy();
  });

  it('renders acronym when logoUrl is empty', () => {
    render(<TeamCircle team={{ ...baseTeam, logoUrl: '' }} />);

    expect(screen.getByText('LFC')).toBeTruthy();
    expect(screen.queryByTestId('team-logo-liverpool')).toBeNull();
  });

  it('renders image when logoUrl is provided', () => {
    render(
      <TeamCircle
        team={{ ...baseTeam, logoUrl: 'https://example.com/crest.png' }}
      />,
    );

    expect(screen.getByTestId('team-logo-liverpool')).toBeTruthy();
    expect(screen.queryByText('LFC')).toBeNull();
  });
});
