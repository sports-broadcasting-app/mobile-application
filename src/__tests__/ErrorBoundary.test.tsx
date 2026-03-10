import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test crash');
  }
  return <Text>Working fine</Text>;
}

// Silence console.error for expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Test crash')) return;
    if (typeof args[0] === 'string' && args[0].includes('Error Boundary'))
      return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Working fine')).toBeTruthy();
  });

  it('shows fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Algo deu errado')).toBeTruthy();
    expect(screen.getByText('Test crash')).toBeTruthy();
    expect(screen.getByText('Tentar novamente')).toBeTruthy();
  });

  it('recovers when retry is pressed', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Algo deu errado')).toBeTruthy();

    rerender(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    );

    fireEvent.press(screen.getByTestId('error-boundary-retry'));

    expect(screen.getByText('Working fine')).toBeTruthy();
  });

  it('uses custom fallback when provided', () => {
    render(
      <ErrorBoundary
        fallback={({ error, onRetry: _onRetry }) => (
          <Text testID="custom-fallback">Custom: {error.message}</Text>
        )}
      >
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('custom-fallback')).toBeTruthy();
    expect(screen.getByText('Custom: Test crash')).toBeTruthy();
  });
});
