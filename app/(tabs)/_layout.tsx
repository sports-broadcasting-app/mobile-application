import { NativeTabs } from 'expo-router/native-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../src/contexts/ThemeContext';

// Native tab bar: floating Liquid Glass on iOS 26+, Material bar on Android.
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
          sf={{ default: 'tv', selected: 'tv.fill' }}
          src={
            <NativeTabs.Trigger.VectorIcon
              family={MaterialCommunityIcons}
              name="television-classic"
            />
          }
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="classificacao">
        <NativeTabs.Trigger.Label>Classificação</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'trophy', selected: 'trophy.fill' }}
          src={
            <NativeTabs.Trigger.VectorIcon
              family={MaterialCommunityIcons}
              name="trophy-outline"
            />
          }
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="configuracoes">
        <NativeTabs.Trigger.Label>Configurações</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          src={
            <NativeTabs.Trigger.VectorIcon
              family={MaterialCommunityIcons}
              name="cog"
            />
          }
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
