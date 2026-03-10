import { render, screen } from '../test-utils';
import { CountdownTimer } from '../components/CountdownTimer';

describe('CountdownTimer', () => {
  it('renders countdown for not-started match', () => {
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    render(<CountdownTimer isoDate={futureDate} status="match-not-started" />);

    expect(screen.getByTestId('countdown-timer')).toBeTruthy();
  });

  it('renders AO VIVO for live match', () => {
    render(
      <CountdownTimer isoDate={new Date().toISOString()} status="match-live" />,
    );

    expect(screen.getByText('AO VIVO')).toBeTruthy();
  });

  it('renders ENCERRADO for ended match', () => {
    render(
      <CountdownTimer
        isoDate={new Date().toISOString()}
        status="match-ended"
      />,
    );

    expect(screen.getByText('ENCERRADO')).toBeTruthy();
  });
});
