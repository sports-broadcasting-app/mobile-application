import { render, screen } from '@testing-library/react-native';
import { BroadcasterCircle } from '../components/BroadcasterCircle';

describe('BroadcasterCircle', () => {
  it('renders branded circle for known broadcaster', () => {
    render(<BroadcasterCircle name="ESPN" />);

    expect(screen.getByTestId('broadcaster-circle-ESPN')).toBeTruthy();
    expect(screen.getByText('E')).toBeTruthy();
  });

  it('returns null for unknown broadcaster', () => {
    const { toJSON } = render(<BroadcasterCircle name="UnknownTV" />);

    expect(toJSON()).toBeNull();
  });

  it('renders correct initials for multi-char broadcaster', () => {
    render(<BroadcasterCircle name="SporTV" />);

    expect(screen.getByText('ST')).toBeTruthy();
  });

  it('renders Disney+ brand', () => {
    render(<BroadcasterCircle name="Disney+" />);

    expect(screen.getByTestId('broadcaster-circle-Disney+')).toBeTruthy();
    expect(screen.getByText('D+')).toBeTruthy();
  });
});
