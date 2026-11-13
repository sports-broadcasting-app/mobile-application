import type { Snapshot } from '../src/types/snapshot';

const MIN_TEAMS = 8;

/** Throws on a suspicious result so the last good snapshot stays published. */
export function assertValidSnapshot(snapshot: Snapshot): void {
  if (snapshot.competitions.length === 0) {
    throw new Error('No competition collected');
  }

  for (const competition of snapshot.competitions) {
    const { name, teams, matches, standings } = competition;
    if (teams.length < MIN_TEAMS) {
      throw new Error(`${name}: only ${teams.length} teams found`);
    }
    if (standings.length !== teams.length) {
      throw new Error(`${name}: standings do not match the teams`);
    }
    if (matches.length < teams.length) {
      throw new Error(`${name}: only ${matches.length} matches found`);
    }

    const teamIds = new Set(teams.map((team) => team.id));
    const orphan = matches.find(
      (match) =>
        !teamIds.has(match.homeTeamId) || !teamIds.has(match.awayTeamId),
    );
    if (orphan) throw new Error(`${name}: unknown team in match ${orphan.id}`);

    const invalidDate = matches.find((m) =>
      Number.isNaN(Date.parse(m.startsAt)),
    );
    if (invalidDate) {
      throw new Error(`${name}: invalid date in match ${invalidDate.id}`);
    }
  }
}
