import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { FavoritesProvider } from '@/entities/team/model/FavoritesContext';
import { CompetitionProvider } from '@/entities/competition/model/CompetitionContext';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'always',
        retry: false,
        gcTime: 0,
      },
    },
  });
}

/** A 390 × 844 phone with a notch and a home indicator (34 pt). */
export const TEST_SAFE_AREA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <FavoritesProvider>
            <CompetitionProvider>{children}</CompetitionProvider>
          </FavoritesProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function customRender(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react-native';
export { customRender as render };
