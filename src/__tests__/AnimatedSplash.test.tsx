import { Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AnimatedSplash } from '../components/AnimatedSplash';

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(() => Promise.resolve()),
}));

function renderSplash() {
  return render(
    <AnimatedSplash>
      <Text>Conteudo</Text>
    </AnimatedSplash>,
  );
}

// The splash awaits promises before animating, so the clock has to move on
// again after each round of them settles.
async function finishAnimation() {
  for (let round = 0; round < 6; round += 1) {
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  }
}

describe('AnimatedSplash', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the app underneath the splash', () => {
    renderSplash();
    expect(screen.getByText('Conteudo')).toBeTruthy();
    expect(screen.getByTestId('animated-splash')).toBeTruthy();
  });

  it('hides the native splash and removes itself once both layers load', async () => {
    renderSplash();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

    fireEvent(screen.getByTestId('splash-back'), 'loadEnd');
    fireEvent(screen.getByTestId('splash-front'), 'loadEnd');
    await finishAnimation();

    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('animated-splash')).toBeNull();
    expect(screen.getByText('Conteudo')).toBeTruthy();
  });

  it('never leaves the app stuck when an image fails to load', async () => {
    renderSplash();
    await finishAnimation();

    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('animated-splash')).toBeNull();
  });
});
