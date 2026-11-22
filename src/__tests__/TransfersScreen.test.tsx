import { fireEvent, render, screen } from '@testing-library/react-native';
import TransfersScreen from '../screens/TransfersScreen';
import type { Team, Transfer } from '../types/snapshot';

const sada: Team = {
  id: 'SDC',
  name: 'SADA CRUZEIRO',
  code: 'SDC',
  badgeUrl: null,
};
const minas: Team = { id: 'MTC', name: 'MINAS', code: 'MTC', badgeUrl: null };

function transfer(id: string, athleteName: string, toTeam: Team): Transfer {
  return {
    id,
    athleteName,
    position: 'Ponteiro',
    from: { teamId: null, name: 'Modena (ITA)' },
    to: { teamId: toTeam.id, name: toTeam.name },
    date: '2026-07-15',
    loan: false,
    sourceUrl: 'https://example.com/news',
  };
}

const mockTransfers = [
  transfer('t1', 'Atleta Um', sada),
  transfer('t2', 'Atleta Dois', minas),
];

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({}),
}));
jest.mock('../contexts/ThemeContext', () => {
  const { lightTheme } = jest.requireActual('../constants/theme');
  return { useTheme: () => ({ colors: lightTheme, isDark: false }) };
});
jest.mock('../contexts/FavoritesContext', () => ({
  useFavorites: () => ({ favorites: { masculina: 'SDC' } }),
}));
jest.mock('../hooks/useSuperliga', () => ({
  useTeamsById: () => new Map([sada, minas].map((t) => [t.id, t])),
  useTeams: () => ({ data: [sada, minas] }),
  useTransfers: () => ({ data: mockTransfers }),
}));

describe('TransfersScreen', () => {
  it('lists the favorite team first, then the others', () => {
    render(<TransfersScreen />);
    expect(screen.getByTestId('transfers-section-Seu time')).toBeTruthy();
    expect(screen.getByTestId('transfers-section-Demais times')).toBeTruthy();
    expect(screen.getByText(/Atleta Um/)).toBeTruthy();
    expect(screen.getByText(/Atleta Dois/)).toBeTruthy();
  });

  it('filters by athlete and says when nothing matches', () => {
    render(<TransfersScreen />);
    fireEvent.changeText(screen.getByTestId('transfer-search'), 'Dois');
    expect(screen.queryByText(/Atleta Um/)).toBeNull();
    expect(screen.getByText(/Atleta Dois/)).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('transfer-search'), 'zzz');
    expect(screen.getByText('Nenhuma transferência encontrada')).toBeTruthy();
  });
});
