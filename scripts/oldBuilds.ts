/**
 * What each app build already in people's phones checks before it takes the
 * published file. Builds keep running for years and cannot be fixed, so
 * these are frozen copies of their code (`isValidSnapshot` and
 * `keepKnownCompetitions` in src/services/snapshotService.ts at each version
 * bump). Never edit one to make a run or a test pass: change what is
 * published instead.
 *
 * Every run checks its file with them before writing (`assertOldBuildsRead`),
 * and src/__tests__/oldBuilds.test.ts does it on every PR. Formula 1 went to
 * `series` because of the `teams` rule below.
 */

import { asList, asObject } from '../src/utils/json.ts';

interface OldBuild {
  builds: string;
  file: 'onde-passa.json' | 'superliga.json';
  reads: (data: unknown) => boolean;
}

/** What both checks ask of each competition: teams and a list of matches. */
const hasTeamsAndMatches = (competition: unknown) => {
  const { teams, matches } = asObject(competition);
  return asList(teams).length > 0 && Array.isArray(matches);
};

/** Version 2 builds: every competition needs teams; one known slug must stay. */
function version2(known: string[]) {
  return (data: unknown): boolean => {
    const { version, competitions } = asObject(data);
    return (
      version === 2 &&
      Array.isArray(competitions) &&
      competitions.every(hasTeamsAndMatches) &&
      competitions.some((c) => known.includes(String(asObject(c).slug)))
    );
  };
}

export const OLD_BUILDS: OldBuild[] = [
  {
    // Before onde-passa.json: both Superligas, exactly.
    builds: 'first release',
    file: 'superliga.json',
    reads: (data) => {
      const { version, competitions } = asObject(data);
      return (
        version === 1 &&
        Array.isArray(competitions) &&
        competitions.length === 2 &&
        competitions.every(hasTeamsAndMatches)
      );
    },
  },
  {
    builds: '1.0 to 1.2',
    file: 'onde-passa.json',
    reads: version2(['masculina', 'feminina', 'serie-a', 'nfl']),
  },
  {
    builds: '1.3 to 1.4',
    file: 'onde-passa.json',
    reads: version2(['masculina', 'feminina', 'serie-a', 'nfl', 'nba']),
  },
];

/** Throws when a build out there would reject what this run is about to publish. */
export function assertOldBuildsRead(files: {
  'onde-passa.json': unknown;
  'superliga.json': unknown;
}): void {
  // Through JSON, as the app gets it: undefined fields are gone.
  const published = {
    'onde-passa.json': JSON.parse(JSON.stringify(files['onde-passa.json'])),
    'superliga.json': JSON.parse(JSON.stringify(files['superliga.json'])),
  };
  const rejecting = OLD_BUILDS.filter((b) => !b.reads(published[b.file]));
  if (rejecting.length > 0) {
    throw new Error(
      `Builds already released would reject the file: ${rejecting
        .map((b) => `${b.builds} (${b.file})`)
        .join(', ')}`,
    );
  }
}
