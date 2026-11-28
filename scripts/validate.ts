import type { CompetitionData, Snapshot } from '../src/shared/api/snapshot';

const MIN_TEAMS = 8;

/** Throws on a suspicious result so the last good snapshot stays published. */
export function assertValidSnapshot(snapshot: Snapshot): void {
  if (snapshot.competitions.length === 0) {
    throw new Error('No competition collected');
  }

  // Builds before 1.5 reject the whole file over one entry of
  // `competitions` without teams: those belong in `series`.
  for (const competition of snapshot.competitions) {
    if (competition.sessions || competition.teams.length === 0) {
      throw new Error(
        `${competition.name}: belongs in series, not competitions`,
      );
    }
    assertValidCompetition(competition);
  }
  for (const series of snapshot.series ?? []) {
    if (!series.sessions) {
      throw new Error(`${series.name}: a series needs sessions`);
    }
    assertValidCompetition(series);
  }
}

/** Throws when one competition looks broken (a source changed its page). */
export function assertValidCompetition(competition: CompetitionData): void {
  if (competition.sessions) {
    assertValidSeries(competition);
    return;
  }
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
    (match) => !teamIds.has(match.homeTeamId) || !teamIds.has(match.awayTeamId),
  );
  if (orphan) throw new Error(`${name}: unknown team in match ${orphan.id}`);

  const invalidDate = matches.find((m) => Number.isNaN(Date.parse(m.startsAt)));
  if (invalidDate) {
    throw new Error(`${name}: invalid date in match ${invalidDate.id}`);
  }
}

/**
 * A motorsport series: sessions only. It may be empty between seasons (ge
 * lists only the coming weekends), but never with teams or matches, and
 * every session needs a date, a weekend and a unique id.
 */
function assertValidSeries(competition: CompetitionData): void {
  const { name, teams, matches, sessions = [] } = competition;
  if (teams.length > 0 || matches.length > 0) {
    throw new Error(`${name}: a series has sessions, not teams or matches`);
  }
  const ids = new Set<string>();
  for (const session of sessions) {
    if (ids.has(session.id)) {
      throw new Error(`${name}: session ${session.id} twice`);
    }
    ids.add(session.id);
    if (Number.isNaN(Date.parse(session.startsAt))) {
      throw new Error(`${name}: invalid date in session ${session.id}`);
    }
    if (!session.grandPrixId || !session.name) {
      throw new Error(`${name}: session ${session.id} without a weekend`);
    }
  }
}
