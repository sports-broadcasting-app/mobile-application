import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: '#2563eb',
        headerTitleStyle: { color: '#111', fontWeight: '700' },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="championship/[sport]" />
      <Stack.Screen name="matches/[sport]" />
    </Stack>
  );
}
