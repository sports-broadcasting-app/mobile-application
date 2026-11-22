import { AppState, Platform } from 'react-native';
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';

/** Resolves once the app is in the foreground. */
function whenActive(): Promise<void> {
  if (AppState.currentState === 'active') return Promise.resolve();
  return new Promise((resolve) => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      subscription.remove();
      resolve();
    });
  });
}

/**
 * Asks for tracking once and tells whether the user answered. iOS only shows
 * the prompt to an active app; otherwise the request resolves "undetermined"
 * without a prompt, and the SDK must not start as if the user had answered.
 */
async function trackingAnswered(): Promise<boolean> {
  const current = await getTrackingPermissionsAsync().catch(() => null);
  if (current && current.status !== 'undetermined') return true;
  await whenActive();
  const answer = await requestTrackingPermissionsAsync().catch(() => null);
  return Boolean(answer) && answer?.status !== 'undetermined';
}

/**
 * Consent, then the iOS tracking prompt, then the SDK: Google forbids
 * requesting ads before consent is gathered. Resolves whether ads may load;
 * false also when the tracking prompt could not be shown yet, so the caller
 * tries again on the next foreground.
 */
export async function startAds(): Promise<boolean> {
  try {
    await AdsConsent.gatherConsent();
  } catch {
    // Offline or form error: fall back to the consent stored on earlier runs.
  }

  const { canRequestAds } = await AdsConsent.getConsentInfo();
  if (!canRequestAds) return false;

  if (Platform.OS === 'ios' && !(await trackingAnswered())) return false;

  await mobileAds().initialize();
  return true;
}
