import { Tabs } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jogos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="television-classic"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="classificacao"
        options={{
          title: 'Classificacao',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="trophy-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
