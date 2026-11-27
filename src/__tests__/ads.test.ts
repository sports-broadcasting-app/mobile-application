import { AppState, Platform } from 'react-native';
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { startAds } from '../services/ads';

const gatherConsent = AdsConsent.gatherConsent as jest.Mock;
const getConsentInfo = AdsConsent.getConsentInfo as jest.Mock;
const getTracking = getTrackingPermissionsAsync as jest.Mock;
const requestTracking = requestTrackingPermissionsAsync as jest.Mock;
const initialize = mobileAds().initialize as jest.Mock;

describe('startAds', () => {
  const originalOS = Platform.OS;
  const originalState = AppState.currentState;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    AppState.currentState = 'active';
    getConsentInfo.mockResolvedValue({ canRequestAds: true });
    getTracking.mockResolvedValue({ status: 'undetermined' });
    requestTracking.mockResolvedValue({ status: 'granted' });
  });

  afterEach(() => {
    Platform.OS = originalOS;
    AppState.currentState = originalState;
    jest.restoreAllMocks();
  });

  it('gathers consent and asks for tracking before starting the SDK', async () => {
    await expect(startAds()).resolves.toBe(true);

    expect(gatherConsent).toHaveBeenCalled();
    expect(requestTracking).toHaveBeenCalled();
    expect(initialize).toHaveBeenCalled();
    expect(gatherConsent.mock.invocationCallOrder[0]).toBeLessThan(
      initialize.mock.invocationCallOrder[0]!,
    );
    expect(requestTracking.mock.invocationCallOrder[0]).toBeLessThan(
      initialize.mock.invocationCallOrder[0]!,
    );
  });

  it('never starts the SDK without consent', async () => {
    getConsentInfo.mockResolvedValue({ canRequestAds: false });

    await expect(startAds()).resolves.toBe(false);
    expect(initialize).not.toHaveBeenCalled();
  });

  it('falls back to the stored consent when the form cannot load', async () => {
    gatherConsent.mockRejectedValueOnce(new Error('offline'));

    await expect(startAds()).resolves.toBe(true);
    expect(initialize).toHaveBeenCalled();
  });

  it('does not ask again once the user answered', async () => {
    getTracking.mockResolvedValue({ status: 'denied' });

    await expect(startAds()).resolves.toBe(true);
    expect(requestTracking).not.toHaveBeenCalled();
    expect(initialize).toHaveBeenCalled();
  });

  it('waits when iOS did not show the prompt', async () => {
    requestTracking.mockResolvedValue({ status: 'undetermined' });

    await expect(startAds()).resolves.toBe(false);
    expect(initialize).not.toHaveBeenCalled();
  });

  it('asks only once the app is in the foreground', async () => {
    AppState.currentState = 'background';
    let onChange: ((state: string) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _type: string,
      listener: (state: string) => void,
    ) => {
      onChange = listener;
      return { remove: jest.fn() };
    }) as unknown as typeof AppState.addEventListener);

    const started = startAds();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(requestTracking).not.toHaveBeenCalled();

    onChange?.('active');
    await expect(started).resolves.toBe(true);
    expect(requestTracking).toHaveBeenCalled();
  });

  it('skips the tracking prompt on Android', async () => {
    Platform.OS = 'android';

    await expect(startAds()).resolves.toBe(true);
    expect(getTracking).not.toHaveBeenCalled();
    expect(requestTracking).not.toHaveBeenCalled();
    expect(initialize).toHaveBeenCalled();
  });
});
