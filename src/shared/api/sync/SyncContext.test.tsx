import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { SyncProvider, useSync } from './SyncContext';
import { getSyncState } from '../database';
import { shouldSync, syncSnapshot } from './syncService';

jest.mock('../database', () => ({ getSyncState: jest.fn() }));
jest.mock('./syncService', () => ({
  shouldSync: jest.fn(),
  syncSnapshot: jest.fn(),
}));

const mockedState = getSyncState as jest.Mock;
const mockedLastSync = {
  mockResolvedValue: (
    lastSyncAt: number | null,
    snapshotKey: string | null = null,
  ) => mockedState.mockResolvedValue({ lastSyncAt, snapshotKey, etag: null }),
  mockRejectedValue: (error: Error) => mockedState.mockRejectedValue(error),
};
const mockedShouldSync = shouldSync as jest.Mock;
const mockedSync = syncSnapshot as jest.Mock;

function Probe() {
  const { phase, lastSyncAt, refreshFailed, lastError } = useSync();
  return <Text>{`${phase}|${lastSyncAt}|${refreshFailed}|${lastError}`}</Text>;
}

function VersionProbe() {
  const { lastSyncAt, dataVersion } = useSync();
  return <Text>{`v=${dataVersion} at=${lastSyncAt}`}</Text>;
}

function renderProvider() {
  render(
    <SyncProvider>
      <Probe />
      <VersionProbe />
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
    mockedSync.mockResolvedValue({ syncedAt: 500, dataVersion: 'k500' });
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

  it('keeps the data version when a sync finds the same data', async () => {
    mockedLastSync.mockResolvedValue(100, 'same');
    mockedShouldSync.mockResolvedValue(true);
    mockedSync.mockResolvedValue({ syncedAt: 700, dataVersion: 'same' });
    renderProvider();
    // The check time moves ("Atualizado agora"); the queries' key does not.
    expect(await screen.findByText('v=same at=700')).toBeTruthy();
  });

  it('stands in the sync time for data saved before snapshot keys', async () => {
    mockedLastSync.mockResolvedValue(100);
    mockedShouldSync.mockResolvedValue(false);
    renderProvider();
    expect(await screen.findByText('v=100 at=100')).toBeTruthy();
  });
});
