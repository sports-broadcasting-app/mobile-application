import * as Updates from 'expo-updates';

/**
 * A build installed from the App Store or Play Store. Development and preview
 * builds (other EAS channels) are for us: they show test ads and debug details.
 */
export const IS_STORE_BUILD = !__DEV__ && Updates.channel === 'production';
