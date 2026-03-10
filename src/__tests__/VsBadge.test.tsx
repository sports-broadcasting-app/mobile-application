import { render, screen } from '../test-utils';
import { VsBadge } from '../components/VsBadge';

describe('VsBadge', () => {
  it('renders VS text', () => {
    render(<VsBadge />);

    expect(screen.getByText('VS')).toBeTruthy();
  });

  it('renders with testID', () => {
    render(<VsBadge />);

    expect(screen.getByTestId('vs-badge')).toBeTruthy();
  });
});
