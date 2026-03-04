import { render, screen, fireEvent } from '@testing-library/react-native';
import CampeonatosTabScreen from '../../app/(tabs)/campeonatos';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('CampeonatosTabScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title', () => {
    render(<CampeonatosTabScreen />);

    expect(screen.getByText('Campeonatos')).toBeTruthy();
  });

  it('renders sport cards', () => {
    render(<CampeonatosTabScreen />);

    expect(screen.getByText('Futebol')).toBeTruthy();
    expect(screen.getByText('Volei')).toBeTruthy();
  });

  it('navigates to championship when football is pressed', () => {
    render(<CampeonatosTabScreen />);

    fireEvent.press(screen.getByTestId('campeonatos-sport-football'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/championship/[sport]',
      params: { sport: 'football' },
    });
  });

  it('navigates to championship when volleyball is pressed', () => {
    render(<CampeonatosTabScreen />);

    fireEvent.press(screen.getByTestId('campeonatos-sport-volleyball'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/championship/[sport]',
      params: { sport: 'volleyball' },
    });
  });
});
