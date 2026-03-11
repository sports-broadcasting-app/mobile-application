import { useEffect, useRef } from 'react';
import { useFavoriteTeams } from '../contexts/FavoriteTeamsContext';
import { useTodayMatches } from '../hooks/useTodayMatches';
import {
  useReminderPreferences,
  TIMING_MINUTES,
} from '../hooks/useReminderPreferences';
import {
  scheduleMatchReminder,
  cancelAllScheduledNotifications,
} from '../services/notificationService';
import { TeamMatch } from '../types/match';

export function NotificationScheduler() {
  const { favoriteTeams } = useFavoriteTeams();
  const { matches } = useTodayMatches();
  const { preferences } = useReminderPreferences();
  const scheduled = useRef(false);

  useEffect(() => {
    if (matches.length === 0 || preferences.size === 0) return;
    if (scheduled.current) return;

    const slugToName = new Map(
      favoriteTeams.map((f) => [f.team.slug, f.team.name]),
    );

    // Only schedule for matches where the user explicitly set a reminder
    const matchesWithReminders = matches.filter(
      (m): m is TeamMatch =>
        m.sport !== 'formula1' &&
        m.status === 'match-not-started' &&
        preferences.has(m.id),
    );

    if (matchesWithReminders.length === 0) return;

    scheduled.current = true;

    cancelAllScheduledNotifications().then(() => {
      const seen = new Set<string>();
      matchesWithReminders.forEach((match) => {
        if (seen.has(match.id)) return;
        seen.add(match.id);

        const timing = preferences.get(match.id)!;
        const minutesBefore = TIMING_MINUTES[timing];

        // Skip channel-change (not a time-based reminder)
        if (timing === 'channel-change') return;

        const favSlug = slugToName.has(match.homeTeam.slug)
          ? match.homeTeam.slug
          : slugToName.has(match.awayTeam.slug)
            ? match.awayTeam.slug
            : null;

        const title =
          minutesBefore > 0
            ? `Jogo em ${minutesBefore} minutos!`
            : 'Jogo comecando agora!';

        const body = favSlug
          ? `${slugToName.get(favSlug)} x ${match.homeTeam.slug === favSlug ? match.awayTeam.name : match.homeTeam.name} as ${match.hour}`
          : `${match.homeTeam.name} x ${match.awayTeam.name} as ${match.hour}`;

        scheduleMatchReminder(
          match.id,
          title,
          body,
          new Date(match.isoDate),
          minutesBefore,
        ).catch((err) => console.warn('Failed to schedule notification:', err));
      });
    });

    return () => {
      scheduled.current = false;
    };
  }, [favoriteTeams, matches, preferences]);

  return null;
}
