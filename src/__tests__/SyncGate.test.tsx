import { Text } from 'react-native';
import { fireEvent, render, screen } from '../test-utils';
import { SyncGate } from '../components/SyncGate';
import { useSync } from '../contexts/SyncContext';

jest.mock('../contexts/SyncContext', () => ({ useSync: jest.fn() }));
jest.mock('../data/database', () => ({
  getFavorites: jest.fn(async () => ({})),
}));

const mockedUseSync = useSync as jest.Mock;

function renderGate() {
  return render(
    <SyncGate>
      <Text>Conteudo</Text>
    </SyncGate>,
  );
}

describe('SyncGate', () => {
  it('shows a loader on the first run', async () => {
    mockedUseSync.mockReturnValue({ phase: 'loading', refreshing: true });
    renderGate();
    expect(await screen.findByText(/Buscando/)).toBeTruthy();
    expect(screen.queryByText('Conteudo')).toBeNull();
  });

  it('offers a retry when the first load fails', async () => {
    const refresh = jest.fn();
    mockedUseSync.mockReturnValue({
      phase: 'failed',
      refreshing: false,
      refresh,
    });
    renderGate();
    fireEvent.press(await screen.findByText('Tentar novamente'));
    expect(refresh).toHaveBeenCalled();
  });

  it('shows the app when local data exists', async () => {
    mockedUseSync.mockReturnValue({ phase: 'ready', refreshing: false });
    renderGate();
    expect(await screen.findByText('Conteudo')).toBeTruthy();
  });
});
