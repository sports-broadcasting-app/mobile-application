import { useLocalSearchParams, useRouter } from 'expo-router';
import { MatchesScreen } from '../../src/screens/MatchesScreen';
import { Sport } from '../../src/types/match';

export default function MatchesRoute() {
  const { sport, championship } = useLocalSearchParams<{
    sport: Sport;
    championship?: string;
  }>();
  const router = useRouter();

  return (
    <MatchesScreen
      sport={sport as Sport}
      championship={championship}
      onPressMatch={(match) =>
        router.push({
          pathname: '/match/[id]',
          params: { id: match.id, sport: match.sport },
        })
      }
    />
  );
}
