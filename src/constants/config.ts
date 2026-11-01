const DEFAULT_SUPERLIGA_DATA_URL =
  'https://sports-broadcasting-app.github.io/mobile-application/superliga.json';

const envDataUrl = process.env.EXPO_PUBLIC_SUPERLIGA_DATA_URL;

export const HAS_SUPERLIGA_DATA_URL_ENV = Boolean(envDataUrl);
export const SUPERLIGA_DATA_URL = envDataUrl || DEFAULT_SUPERLIGA_DATA_URL;
