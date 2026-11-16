import { NativeTabs } from 'expo-router/native-tabs';
import { useTheme } from '../../src/contexts/ThemeContext';
import jogos from '../../assets/tabs/tab-jogos.png';
import jogosFill from '../../assets/tabs/tab-jogos-fill.png';
import classificacao from '../../assets/tabs/tab-classificacao.png';
import classificacaoFill from '../../assets/tabs/tab-classificacao-fill.png';
import configuracoes from '../../assets/tabs/tab-configuracoes.png';
import configuracoesFill from '../../assets/tabs/tab-configuracoes-fill.png';

// Native tab bar: floating Liquid Glass on iOS 26+, Material bar on Android.
// The icons are template glyphs (black on transparent) drawn on the 24pt
// SF Symbols grid, so each platform tints them with the tab bar colors.
export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <NativeTabs
      tintColor={isDark ? colors.textPrimary : colors.primary}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Jogos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={{ default: jogos, selected: jogosFill }}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="classificacao">
        <NativeTabs.Trigger.Label>Classificação</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={{ default: classificacao, selected: classificacaoFill }}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="configuracoes">
        <NativeTabs.Trigger.Label>Configurações</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={{ default: configuracoes, selected: configuracoesFill }}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
