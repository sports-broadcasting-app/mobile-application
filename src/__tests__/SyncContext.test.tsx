import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { SyncProvider, useSync } from '../contexts/SyncContext';
import { getLastSyncAt } from '../data/database';
import { shouldSync, syncSnapshot } from '../services/syncService';

jest.mock('../data/database', () => ({ getLastSyncAt: jest.fn() }));
jest.mock('../services/syncService', () => ({
  shouldSync: jest.fn(),
  syncSnapshot: jest.fn(),
}));

const mockedLastSync = getLastSyncAt as jest.Mock;
const mockedShouldSync = shouldSync as jest.Mock;
const mockedSync = syncSnapshot as jest.Mock;

function Probe() {
  const { phase, lastSyncAt, refreshFailed, lastError } = useSync();
  return <Text>{`${phase}|${lastSyncAt}|${refreshFailed}|${lastError}`}</Text>;
}

function renderProvider() {
  render(
    <SyncProvider>
      <Probe />
    </SyncProvider>,
  );
}

describe('SyncProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('downloads on the first run', async () => {
    mockedLastSync.mockResolvedValue(null);
    mockedShouldSync.mockResolvedValue(true);
    mockedSync.mockResolvedValue(500);
    renderProvider();
    expect(await screen.findByText('ready|500|false|null')).toBeTruthy();
  });

  it('fails only when there is no local data', async () => {
    mockedLastSync.mockResolvedValue(null);
    mockedShouldSync.mockResolvedValue(true);
    mockedSync.mockRejectedValue(new Error('offline'));
    renderProvider();
    expect(await screen.findByText('failed|null|true|offline')).toBeTruthy();
  });

  it('reports a failure to read the local database', async () => {
    mockedLastSync.mockRejectedValue(new Error('disk'));
    renderProvider();
    expect(
      await screen.findByText('failed|null|false|Banco local: disk'),
    ).toBeTruthy();
  });

  it('keeps showing local data when a background refresh fails', async () => {
    mockedLastSync.mockResolvedValue(100);
    mockedShouldSync.mockResolvedValue(true);
    mockedSync.mockRejectedValue(new Error('offline'));
    renderProvider();
    expect(await screen.findByText('ready|100|true|offline')).toBeTruthy();
  });

  it('does not download fresh data again', async () => {
    mockedLastSync.mockResolvedValue(100);
    mockedShouldSync.mockResolvedValue(false);
    renderProvider();
    await act(async () => {});
    await waitFor(() =>
      expect(screen.getByText('ready|100|false|null')).toBeTruthy(),
    );
    expect(mockedSync).not.toHaveBeenCalled();
  });
});
