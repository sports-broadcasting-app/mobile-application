import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { AppText } from '@/shared/ui/AppText';
import { TEST_SAFE_AREA } from '@/test/utils';
import { TabsLayout } from './TabsLayout';

jest.mock('expo-blur', () => {
  const { View: MockView } = jest.requireActual('react-native');
  return {
    BlurView: (props: object) => <MockView {...props} />,
    BlurTargetView: (props: object) => <MockView {...props} />,
  };
});

function Providers({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <ThemeProvider>{children}</ThemeProvider>
    </SafeAreaProvider>
  );
}

const renderTabs = () =>
  renderRouter(
    {
      '(tabs)/_layout': TabsLayout,
      '(tabs)/index': () => <AppText>tela jogos</AppText>,
      '(tabs)/classificacao': () => <AppText>tela classificação</AppText>,
      '(tabs)/configuracoes': () => <AppText>tela configurações</AppText>,
    },
    { initialUrl: '/', wrapper: Providers },
  );

describe('TabsLayout', () => {
  it('opens on Jogos, the only tab that shows its name', async () => {
    await renderTabs();
    expect(await screen.findByText('tela jogos')).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(
      screen.getByRole('tab', { name: 'Jogos', selected: true }),
    ).toBeTruthy();
    expect(screen.getByText('Jogos')).toBeTruthy();
    expect(screen.queryByText('Classificação')).toBeNull();
    expect(screen.queryByText('Configurações')).toBeNull();
  });

  it('switches screens and moves the name to the tab pressed', async () => {
    await renderTabs();
    fireEvent.press(screen.getByRole('tab', { name: 'Classificação' }));
    expect(await screen.findByText('tela classificação')).toBeTruthy();
    expect(screen).toHavePathname('/classificacao');
    expect(screen.getByText('Classificação')).toBeTruthy();
    expect(screen.queryByText('Jogos')).toBeNull();

    fireEvent.press(screen.getByRole('tab', { name: 'Configurações' }));
    expect(await screen.findByText('tela configurações')).toBeTruthy();
    expect(screen).toHavePathname('/configuracoes');
  });
});
