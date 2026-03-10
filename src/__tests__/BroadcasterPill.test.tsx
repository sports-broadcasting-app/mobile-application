import { render, screen } from '../test-utils';
import { BroadcasterPill } from '../components/BroadcasterPill';

describe('BroadcasterPill', () => {
  it('renders broadcaster name', () => {
    render(<BroadcasterPill name="ESPN" />);

    expect(screen.getByText('ESPN')).toBeTruthy();
  });

  it('renders different broadcaster', () => {
    render(<BroadcasterPill name="Paramount+" />);

    expect(screen.getByText('Paramount+')).toBeTruthy();
  });
});
