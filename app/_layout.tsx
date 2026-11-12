import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { FavoritesProvider } from '../src/contexts/FavoritesContext';
import { SyncProvider } from '../src/contexts/SyncContext';
import { AdsProvider } from '../src/contexts/AdsContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { SyncGate } from '../src/components/SyncGate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
      staleTime: Infinity,
      retry: false,
    },
  },
});

function RootStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
        headerShadowVisible: false,
        // Without it iOS labels the back button with the "(tabs)" group name.
        headerBackButtonDisplayMode: 'minimal',
        headerStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Screen name="match/[id]" />
      <Stack.Screen name="transferencias" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AdsProvider>
          <QueryClientProvider client={queryClient}>
            <SyncProvider>
              <FavoritesProvider>
                <SyncGate>
                  <RootStack />
                </SyncGate>
              </FavoritesProvider>
            </SyncProvider>
          </QueryClientProvider>
        </AdsProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
