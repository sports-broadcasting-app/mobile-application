import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { FavoritesProvider } from '../src/contexts/FavoritesContext';
import { CompetitionProvider } from '../src/contexts/CompetitionContext';
import { SyncProvider } from '../src/contexts/SyncContext';
import { NotificationsProvider } from '../src/contexts/NotificationsContext';
import { AdsProvider } from '../src/contexts/AdsContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { SyncGate } from '../src/components/SyncGate';
import { AnimatedSplash } from '../src/components/AnimatedSplash';
import { OnboardingGate } from '../src/components/OnboardingGate';
import { NotificationResponder } from '../src/components/NotificationResponder';
import { configureNotifications } from '../src/services/notifications';

// AnimatedSplash hides the native splash once it can take over seamlessly.
SplashScreen.preventAutoHideAsync().catch(() => {});
configureNotifications();

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
    <AnimatedSplash>
      <ThemeProvider>
        <ErrorBoundary>
          <AdsProvider>
            <QueryClientProvider client={queryClient}>
              <SyncProvider>
                <FavoritesProvider>
                  <NotificationsProvider>
                    <CompetitionProvider>
                      <SyncGate>
                        <OnboardingGate>
                          <RootStack />
                          <NotificationResponder />
                        </OnboardingGate>
                      </SyncGate>
                    </CompetitionProvider>
                  </NotificationsProvider>
                </FavoritesProvider>
              </SyncProvider>
            </QueryClientProvider>
          </AdsProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </AnimatedSplash>
  );
}
