import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { CompetitionProvider } from './contexts/CompetitionContext';

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

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <FavoritesProvider>
          <CompetitionProvider>{children}</CompetitionProvider>
        </FavoritesProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function customRender(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react-native';
export { customRender as render };
