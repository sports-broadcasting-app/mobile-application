const DEFAULT_DATA_URL =
  'https://sports-broadcasting-app.github.io/mobile-application/onde-passa.json';

const envDataUrl = process.env.EXPO_PUBLIC_DATA_URL;

export const HAS_DATA_URL_ENV = Boolean(envDataUrl);
export const DATA_URL = envDataUrl || DEFAULT_DATA_URL;
