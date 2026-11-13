import { Platform } from 'react-native';
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

/**
 * Consent, then the iOS tracking prompt, then the SDK: Google forbids
 * requesting ads before consent is gathered. Resolves whether ads may load.
 */
export async function startAds(): Promise<boolean> {
  try {
    await AdsConsent.gatherConsent();
  } catch {
    // Offline or form error: fall back to the consent stored on earlier runs.
  }

  const { canRequestAds } = await AdsConsent.getConsentInfo();
  if (!canRequestAds) return false;

  if (Platform.OS === 'ios') {
    // Asks only once; later calls resolve with the stored answer.
    await requestTrackingPermissionsAsync().catch(() => undefined);
  }

  await mobileAds().initialize();
  return true;
}
