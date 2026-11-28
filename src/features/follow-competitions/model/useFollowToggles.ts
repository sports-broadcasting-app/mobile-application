import { useCallback } from 'react';
import { useCompetition } from '@/entities/competition/model/CompetitionContext';
import { CompetitionSlug, Sport } from '@/shared/api/snapshot';
import { COMPETITIONS, getCompetition } from '@/shared/config/competitions';

export const competitionsOfSport = (sport: Sport): CompetitionSlug[] =>
  COMPETITIONS.filter((info) => info.sport === sport).map((info) => info.slug);

/**
 * Following by sport and by competition, for the sheet and the settings.
 * A sport switch follows or drops all its competitions; the last followed
 * competition of the app cannot be dropped either way.
 */
export function useFollowToggles() {
  const { followed, setFollowed } = useCompetition();

  const sportOn = useCallback(
    (sport: Sport) =>
      followed.some((slug) => getCompetition(slug).sport === sport),
    [followed],
  );

  /** Turning it off would leave nothing followed. */
  const sportLocked = useCallback(
    (sport: Sport) =>
      followed.length > 0 &&
      followed.every((slug) => getCompetition(slug).sport === sport),
    [followed],
  );

  const competitionLocked = useCallback(
    (slug: CompetitionSlug) => followed.length === 1 && followed[0] === slug,
    [followed],
  );

  const setSport = useCallback(
    (sport: Sport, on: boolean) => {
      const own = competitionsOfSport(sport);
      setFollowed(
        on
          ? [...followed, ...own]
          : followed.filter((slug) => !own.includes(slug)),
      );
    },
    [followed, setFollowed],
  );

  const setCompetitionFollowed = useCallback(
    (slug: CompetitionSlug, on: boolean) => {
      setFollowed(
        on ? [...followed, slug] : followed.filter((item) => item !== slug),
      );
    },
    [followed, setFollowed],
  );

  return {
    followed,
    sportOn,
    sportLocked,
    competitionLocked,
    setSport,
    setCompetitionFollowed,
  };
}
