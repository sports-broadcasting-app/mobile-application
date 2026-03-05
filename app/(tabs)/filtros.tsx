import { useRouter } from 'expo-router';
import { FilterScreen } from '../../src/screens/FilterScreen';

export default function FiltrosTabScreen() {
  const router = useRouter();

  return <FilterScreen onApply={() => router.navigate('/')} />;
}
