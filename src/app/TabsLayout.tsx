import { useRef, type ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { BlurTargetView } from 'expo-blur';
import { useTheme } from '@/shared/theme/ThemeContext';
import { GlassTabBar } from '@/shared/ui/GlassTabBar';
import { TabBarButton } from '@/shared/ui/TabBarButton';
import jogos from '../../assets/tabs/tab-jogos.png';
import jogosFill from '../../assets/tabs/tab-jogos-fill.png';
import classificacao from '../../assets/tabs/tab-classificacao.png';
import classificacaoFill from '../../assets/tabs/tab-classificacao-fill.png';
import configuracoes from '../../assets/tabs/tab-configuracoes.png';
import configuracoesFill from '../../assets/tabs/tab-configuracoes-fill.png';

/**
 * The tabs, drawn by the app so iOS and Android look the same: a floating
 * glass capsule where only the active tab shows its name. The screens sit in
 * a `BlurTargetView` so Android can blur them behind the glass.
 */
export function TabsLayout() {
  const { colors } = useTheme();
  const screens = useRef<ComponentRef<typeof View>>(null);

  return (
    <Tabs style={[styles.root, { backgroundColor: colors.background }]}>
      <BlurTargetView ref={screens} style={styles.root}>
        <TabSlot />
      </BlurTargetView>
      <TabList asChild>
        <GlassTabBar blurTarget={screens}>
          <TabTrigger name="index" href="/" asChild>
            <TabBarButton
              label="Jogos"
              icon={jogos}
              selectedIcon={jogosFill}
              testID="tab-jogos"
            />
          </TabTrigger>
          <TabTrigger name="classificacao" href="/classificacao" asChild>
            <TabBarButton
              label="Classificação"
              icon={classificacao}
              selectedIcon={classificacaoFill}
              testID="tab-classificacao"
            />
          </TabTrigger>
          <TabTrigger name="configuracoes" href="/configuracoes" asChild>
            <TabBarButton
              label="Configurações"
              icon={configuracoes}
              selectedIcon={configuracoesFill}
              testID="tab-configuracoes"
            />
          </TabTrigger>
        </GlassTabBar>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
