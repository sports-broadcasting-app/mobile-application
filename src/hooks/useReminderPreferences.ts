import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@reminder_preferences';

export type ReminderTiming =
  | '5min'
  | '15min'
  | '1h'
  | 'kickoff'
  | 'channel-change';

export interface ReminderPreference {
  matchId: string;
  timing: ReminderTiming;
}

export const TIMING_MINUTES: Record<ReminderTiming, number> = {
  '5min': 5,
  '15min': 15,
  '1h': 60,
  kickoff: 0,
  'channel-change': -1,
};

export const TIMING_LABELS: { key: ReminderTiming; label: string }[] = [
  { key: '5min', label: 'Avisar 5 min antes' },
  { key: '15min', label: 'Avisar 15 min antes' },
  { key: '1h', label: 'Avisar 1h antes' },
  { key: 'kickoff', label: 'Avisar quando comecar' },
  { key: 'channel-change', label: 'Avisar mudanca de canal' },
];

export function useReminderPreferences() {
  const [preferences, setPreferences] = useState<Map<string, ReminderTiming>>(
    new Map(),
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) {
        const entries: ReminderPreference[] = JSON.parse(json);
        setPreferences(new Map(entries.map((e) => [e.matchId, e.timing])));
      }
    });
  }, []);

  const persist = useCallback(async (updated: Map<string, ReminderTiming>) => {
    const entries = Array.from(updated.entries()).map(([matchId, timing]) => ({
      matchId,
      timing,
    }));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, []);

  const setReminder = useCallback(
    async (matchId: string, timing: ReminderTiming) => {
      setPreferences((prev) => {
        const updated = new Map(prev);
        updated.set(matchId, timing);
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const removeReminder = useCallback(
    async (matchId: string) => {
      setPreferences((prev) => {
        const updated = new Map(prev);
        updated.delete(matchId);
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const getReminder = useCallback(
    (matchId: string): ReminderTiming | null => {
      return preferences.get(matchId) ?? null;
    },
    [preferences],
  );

  return { preferences, setReminder, removeReminder, getReminder };
}
