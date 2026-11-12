import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { startAds } from '../services/ads';

const gatherConsent = AdsConsent.gatherConsent as jest.Mock;
const getConsentInfo = AdsConsent.getConsentInfo as jest.Mock;
const requestTracking = requestTrackingPermissionsAsync as jest.Mock;
const initialize = mobileAds().initialize as jest.Mock;

describe('startAds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getConsentInfo.mockResolvedValue({ canRequestAds: true });
  });

  it('gathers consent and asks for tracking before starting the SDK', async () => {
    await expect(startAds()).resolves.toBe(true);

    expect(gatherConsent).toHaveBeenCalled();
    expect(requestTracking).toHaveBeenCalled();
    expect(initialize).toHaveBeenCalled();
    expect(gatherConsent.mock.invocationCallOrder[0]).toBeLessThan(
      initialize.mock.invocationCallOrder[0],
    );
    expect(requestTracking.mock.invocationCallOrder[0]).toBeLessThan(
      initialize.mock.invocationCallOrder[0],
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
});
