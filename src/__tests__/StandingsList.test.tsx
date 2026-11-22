import { render, screen } from '../test-utils';
import { groupStandings, StandingsList } from '../components/StandingsList';
import { Standing, Team } from '../types/snapshot';

const teams: Team[] = [
  { id: '1', name: 'Buffalo Bills', code: 'BUF', badgeUrl: null },
  { id: '2', name: 'Miami Dolphins', code: 'MIA', badgeUrl: null },
  { id: '3', name: 'Seattle Seahawks', code: 'SEA', badgeUrl: null },
];
const teamsById = new Map(teams.map((team) => [team.id, team]));

function standing(teamId: string, position: number, group?: string): Standing {
  return {
    teamId,
    position,
    points: 0,
    matches: 9,
    wins: 8,
    draws: 0,
    losses: 1,
    scoredFor: 287,
    scoredAgainst: 199,
    group,
  };
}

describe('groupStandings', () => {
  it('keeps a single table as one unnamed group', () => {
    const rows = [standing('1', 1), standing('2', 2)];
    expect(groupStandings(rows)).toEqual([{ name: undefined, rows }]);
  });

  it('splits by group in the order given', () => {
    const groups = groupStandings([
      standing('1', 1, 'AFC Leste'),
      standing('2', 2, 'AFC Leste'),
      standing('3', 1, 'NFC Oeste'),
    ]);
    expect(groups.map((g) => [g.name, g.rows.length])).toEqual([
      ['AFC Leste', 2],
      ['NFC Oeste', 1],
    ]);
  });
});

describe('StandingsList', () => {
  it('shows a header per division with the positions inside it', () => {
    render(
      <StandingsList
        sport="futebol-americano"
        standings={[
          standing('1', 1, 'AFC Leste'),
          standing('2', 2, 'AFC Leste'),
          standing('3', 1, 'NFC Oeste'),
        ]}
        teamsById={teamsById}
        isFavorite={() => false}
      />,
    );
    expect(screen.getByTestId('standing-group-AFC Leste')).toBeTruthy();
    expect(screen.getByTestId('standing-group-NFC Oeste')).toBeTruthy();
    expect(screen.getByTestId('standing-row-3')).toHaveTextContent(
      /1\s*Seahawks/,
    );
    // The code header is hidden from screen readers (rows say the names).
    expect(
      screen.getByText('DIF', { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.getByTestId('standing-row-1')).toHaveTextContent(/88$/);
  });

  it('shows no division header for a single table', () => {
    render(
      <StandingsList
        sport="futebol"
        standings={[standing('1', 1), standing('2', 2)]}
        teamsById={teamsById}
        isFavorite={() => false}
      />,
    );
    expect(screen.queryByTestId(/standing-group-/)).toBeNull();
    expect(screen.getByTestId('standing-row-2')).toBeTruthy();
  });

  it('reads each row with its column names', () => {
    render(
      <StandingsList
        sport="futebol-americano"
        standings={[standing('1', 1)]}
        teamsById={teamsById}
        isFavorite={() => false}
      />,
    );
    expect(
      screen.getByLabelText(/^1º, Bills, 8 vitórias, 1 derrota,/),
    ).toBeTruthy();
  });
});
