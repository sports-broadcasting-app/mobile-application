import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTeams, TeamsResponse } from '../services/matchService';

const CACHE_KEY = '@teams_cache';

export function useTeamsWithCache() {
  const [cachedData, setCachedData] = useState<TeamsResponse | undefined>(
    undefined,
  );
  const [cacheLoaded, setCacheLoaded] = useState(false);

  // Read cache on mount
  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY)
      .then((json) => {
        if (json) {
          setCachedData(JSON.parse(json) as TeamsResponse);
        }
      })
      .catch(() => {})
      .finally(() => setCacheLoaded(true));
  }, []);

  const query = useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchTeams(),
    placeholderData: cachedData,
    enabled: cacheLoaded,
  });

  // Write to cache when fresh data arrives
  useEffect(() => {
    if (query.data && query.data !== cachedData) {
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(query.data)).catch(
        () => {},
      );
    }
  }, [query.data, cachedData]);

  return {
    data: query.data,
    isLoading: !cacheLoaded || (query.isLoading && !cachedData),
    error: query.error,
  };
}
