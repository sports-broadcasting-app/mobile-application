import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '@/shared/theme/ThemeContext';
import { FavoritesProvider } from '@/entities/team/model/FavoritesContext';
import { CompetitionProvider } from '@/entities/competition/model/CompetitionContext';
import { SyncProvider } from '@/shared/api/sync/SyncContext';
import { NotificationsProvider } from '@/features/reminders/model/NotificationsContext';
import { AdsProvider, AdsStarter } from '@/features/ads/model/AdsContext';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { SyncGate } from '@/app/SyncGate';
import { AnimatedSplash } from '@/app/AnimatedSplash';
import { OnboardingGate } from '@/app/OnboardingGate';
import { NotificationResponder } from '@/app/NotificationResponder';
import { configureNotifications } from '@/features/reminders/api/notifications';

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

/** Dark icons over the light theme, light over the dark one, on every screen. */
function ThemedStatusBar() {
  const { colors } = useTheme();
  return <StatusBar style={colors.statusBar} />;
}

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
      <Stack.Screen name="grand-prix/[id]" />
      <Stack.Screen name="transferencias" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AnimatedSplash>
      <ThemeProvider>
        <ThemedStatusBar />
        <ErrorBoundary>
          <AdsProvider>
            <QueryClientProvider client={queryClient}>
              <SyncProvider>
                <FavoritesProvider>
                  <CompetitionProvider>
                    <NotificationsProvider>
                      <SyncGate>
                        <OnboardingGate>
                          <RootStack />
                          <NotificationResponder />
                          <AdsStarter />
                        </OnboardingGate>
                      </SyncGate>
                    </NotificationsProvider>
                  </CompetitionProvider>
                </FavoritesProvider>
              </SyncProvider>
            </QueryClientProvider>
          </AdsProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </AnimatedSplash>
  );
}
