import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { FavoriteTeamProvider } from '../src/contexts/FavoriteTeamContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { NotificationScheduler } from '../src/components/NotificationScheduler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

function RootStack() {
  const { colors } = useTheme();

  return (
    <>
      <NotificationScheduler />
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.surface },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="championship/[sport]" />
        <Stack.Screen name="matches/[sport]" />
        <Stack.Screen name="match/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <FavoriteTeamProvider>
            <RootStack />
          </FavoriteTeamProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
