import { useRouter } from 'expo-router';
import { HomeScreen } from '../../src/screens/HomeScreen';

export default function HomeTabScreen() {
  const router = useRouter();

  return (
    <HomeScreen
      onPressMatch={(match) =>
        router.push({
          pathname: '/match/[id]',
          params: { id: match.id, sport: match.sport },
        })
      }
      onPressSettings={() => router.push('/(tabs)/configuracoes')}
    />
  );
}
