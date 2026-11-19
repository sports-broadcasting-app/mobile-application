process.env.TZ = 'America/Sao_Paulo';

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|expo-router|@sentry/react-native|native-base|react-native-svg|@tanstack/.*|@react-native-async-storage/.*)',
  ],
  setupFilesAfterEnv: ['./src/test-setup.ts'],
  // On the CI runner (no Jest cache) the first test of a screen file pays for
  // transforming every module the screen imports: SettingsReminderOffer took
  // 5-8 s there and timed out at the 5 s default, while it runs in ~3 s locally.
  testTimeout: 15_000,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
