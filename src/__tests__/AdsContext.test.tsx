import { AppState, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { AdsProvider, AdsStarter, useAds } from '../contexts/AdsContext';
import { startAds } from '../services/ads';

jest.mock('../services/ads', () => ({ startAds: jest.fn() }));

const mockStartAds = startAds as jest.Mock;

function Ready() {
  return <Text>{useAds().adsReady ? 'ready' : 'waiting'}</Text>;
}

describe('AdsProvider and AdsStarter', () => {
  let onChange: ((state: string) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    onChange = undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _type: string,
      listener: (state: string) => void,
    ) => {
      onChange = listener;
      return { remove: jest.fn() };
    }) as unknown as typeof AppState.addEventListener);
  });

  afterEach(() => jest.restoreAllMocks());

  it('does not start ads until AdsStarter mounts', () => {
    render(
      <AdsProvider>
        <Ready />
      </AdsProvider>,
    );
    expect(mockStartAds).not.toHaveBeenCalled();
    expect(screen.getByText('waiting')).toBeTruthy();
  });

  it('starts ads when AdsStarter mounts', async () => {
    mockStartAds.mockResolvedValue(true);
    render(
      <AdsProvider>
        <AdsStarter />
        <Ready />
      </AdsProvider>,
    );
    expect(await screen.findByText('ready')).toBeTruthy();
    expect(mockStartAds).toHaveBeenCalledTimes(1);
  });

  it('tries again when the app comes back to the foreground', async () => {
    mockStartAds.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    render(
      <AdsProvider>
        <AdsStarter />
        <Ready />
      </AdsProvider>,
    );
    await act(async () => {});
    expect(screen.getByText('waiting')).toBeTruthy();

    await act(async () => onChange?.('active'));
    expect(await screen.findByText('ready')).toBeTruthy();
    expect(mockStartAds).toHaveBeenCalledTimes(2);
  });
});
