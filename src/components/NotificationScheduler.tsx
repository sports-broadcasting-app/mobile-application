import { useEffect, useRef } from 'react';
import { useFavoriteTeam } from '../contexts/FavoriteTeamContext';
import { useTodayMatches } from '../hooks/useTodayMatches';
import {
  scheduleMatchReminder,
  cancelAllScheduledNotifications,
} from '../services/notificationService';
import { TeamMatch } from '../types/match';

export function NotificationScheduler() {
  const { favoriteTeam } = useFavoriteTeam();
  const { matches } = useTodayMatches();
  const scheduled = useRef(false);

  useEffect(() => {
    if (!favoriteTeam || matches.length === 0) return;

    const teamSlug = favoriteTeam.team.slug;

    const teamMatches = matches.filter(
      (m): m is TeamMatch =>
        m.sport !== 'formula1' &&
        (m.homeTeam.slug === teamSlug || m.awayTeam.slug === teamSlug) &&
        m.status === 'match-not-started',
    );

    if (teamMatches.length === 0) return;
    if (scheduled.current) return;

    scheduled.current = true;

    cancelAllScheduledNotifications().then(() => {
      teamMatches.forEach((match) => {
        const opponent =
          match.homeTeam.slug === teamSlug
            ? match.awayTeam.name
            : match.homeTeam.name;

        scheduleMatchReminder(
          match.id,
          'Jogo em 30 minutos! ⚽',
          `${favoriteTeam.team.name} x ${opponent} às ${match.hour}`,
          new Date(match.isoDate),
        ).catch((err) => console.warn('Failed to schedule notification:', err));
      });
    });

    return () => {
      scheduled.current = false;
    };
  }, [favoriteTeam, matches]);

  return null;
}
