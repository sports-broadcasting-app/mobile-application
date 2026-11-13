import type { Match, Snapshot, Standing } from '../src/types/snapshot';

/**
 * The first app release reads `superliga.json` in this shape and rejects
 * anything else, so it keeps being published next to the new file until
 * those installs are gone. Only the Superligas go in it.
 */
export interface LegacySnapshot {
  version: 1;
  generatedAt: string;
  season: string;
  competitions: {
    slug: string;
    name: string;
    teams: unknown[];
    matches: LegacyMatch[];
    standings: LegacyStanding[];
    transfers?: unknown[];
  }[];
}

type LegacyMatch = Omit<Match, 'homeScore' | 'awayScore'> & {
  homeSets: number | null;
  awaySets: number | null;
};

type LegacyStanding = Omit<
  Standing,
  'draws' | 'scoredFor' | 'scoredAgainst'
> & {
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
};

function toLegacyMatch({ homeScore, awayScore, ...match }: Match): LegacyMatch {
  return { ...match, homeSets: homeScore, awaySets: awayScore };
}

function toLegacyStanding({
  draws: _draws,
  scoredFor,
  scoredAgainst,
  ...standing
}: Standing): LegacyStanding {
  return {
    ...standing,
    setsWon: scoredFor,
    setsLost: scoredAgainst,
    // Rally points are no longer collected; the old app never showed them.
    pointsWon: 0,
    pointsLost: 0,
  };
}

export function toLegacySnapshot(snapshot: Snapshot): LegacySnapshot {
  const volleyball = snapshot.competitions.filter((c) => c.sport === 'volei');
  return {
    version: 1,
    generatedAt: snapshot.generatedAt,
    season: volleyball[0]?.season ?? '',
    competitions: volleyball.map((competition) => ({
      slug: competition.slug,
      name: competition.name,
      teams: competition.teams,
      matches: competition.matches.map(toLegacyMatch),
      standings: competition.standings.map(toLegacyStanding),
      transfers: competition.transfers,
    })),
  };
}
