import { useLocalSearchParams } from 'expo-router';
import { MatchDetailScreen } from '../../src/screens/MatchDetailScreen';
import { Sport } from '../../src/types/match';

export default function MatchDetailRoute() {
  const { id, sport } = useLocalSearchParams<{ id: string; sport: Sport }>();

  return <MatchDetailScreen id={id!} sport={sport as Sport} />;
}
