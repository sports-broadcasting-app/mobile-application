import { render, screen, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../app/index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  Stack: { Screen: () => null },
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title', () => {
    render(<HomeScreen />);

    expect(screen.getByText('Onde Assistir')).toBeTruthy();
  });

  it('renders sport cards', () => {
    render(<HomeScreen />);

    expect(screen.getByText('Futebol')).toBeTruthy();
    expect(screen.getByText('Volei')).toBeTruthy();
  });

  it('navigates to championship when football card is pressed', () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByTestId('sport-card-football'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/championship/[sport]',
      params: { sport: 'football' },
    });
  });

  it('navigates to championship when volleyball card is pressed', () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByTestId('sport-card-volleyball'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/championship/[sport]',
      params: { sport: 'volleyball' },
    });
  });
});
