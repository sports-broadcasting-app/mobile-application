import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChampionshipScreen } from '../../src/screens/ChampionshipScreen';
import { Sport } from '../../src/types/match';

export default function ChampionshipRoute() {
  const { sport } = useLocalSearchParams<{ sport: Sport }>();
  const router = useRouter();

  return (
    <ChampionshipScreen
      sport={sport as Sport}
      onPressChampionship={(slug) =>
        router.push({
          pathname: '/matches/[sport]',
          params: { sport: sport as string, championship: slug },
        })
      }
    />
  );
}
