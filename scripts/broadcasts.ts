import type {
  CompetitionData,
  CompetitionSlug,
  Match,
  Team,
} from '../src/types/snapshot';
import { normalizeForSearch } from '../src/utils/search.ts';

/**
 * Broadcasters the sources do not list, curated by hand in broadcasts.json.
 * ge only knows Globo's channels and its partners, so a game streamed by
 * Netflix or Prime Video in Brazil comes with no broadcaster at all. Each
 * line names the game by its Brasília date and the two team codes (as the
 * standings show them, e.g. "LAR" and "GB") and needs the article URL that
 * says where it is shown in Brazil.
 */
export interface BroadcastEntry {
  /** Brasília calendar date of the kickoff, `YYYY-MM-DD`. */
  date: string;
  home: string;
  away: string;
  channels: string[];
  source: string;
}

export type BroadcastFile = Partial<Record<CompetitionSlug, BroadcastEntry[]>>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The calendar date of an instant in Brasília, `YYYY-MM-DD`. */
export function brasiliaDate(startsAt: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(Date.parse(startsAt)));
}

function findTeam(value: string, teams: Team[]): Team | undefined {
  const term = normalizeForSearch(value);
  return teams.find(
    (team) =>
      normalizeForSearch(team.code) === term ||
      normalizeForSearch(team.name) === term,
  );
}

function findMatch(
  matches: Match[],
  date: string,
  home: Team,
  away: Team,
): Match | undefined {
  return matches.find(
    (m) =>
      brasiliaDate(m.startsAt) === date &&
      ((m.homeTeamId === home.id && m.awayTeamId === away.id) ||
        (m.homeTeamId === away.id && m.awayTeamId === home.id)),
  );
}

/**
 * Adds the curated broadcasters to their games, after the ones the source
 * gave, without repeats. Throws on any doubtful line so a typo never reaches
 * the app (the published file then stays as it was); a line whose game is
 * not in the snapshot is only a warning. Mutates the matches; returns the
 * log lines.
 */
export function applyBroadcasts(
  competitions: CompetitionData[],
  file: BroadcastFile,
): string[] {
  const log: string[] = [];
  for (const [slug, entries] of Object.entries(file) as [
    string,
    BroadcastEntry[],
  ][]) {
    const competition = competitions.find((c) => c.slug === slug);
    if (!competition) {
      log.push(`::warning::broadcasts.json: no competition "${slug}"`);
      continue;
    }
    let added = 0;
    entries.forEach((entry, index) => {
      const where = `broadcasts.json ${slug} #${index + 1}`;
      if (!DATE.test(entry.date ?? '')) {
        throw new Error(`${where}: date must be YYYY-MM-DD`);
      }
      if (!/^https?:\/\//.test(entry.source ?? '')) {
        throw new Error(`${where}: source must be the article URL`);
      }
      const channels = (entry.channels ?? []).map((c) => c.trim());
      if (channels.length === 0 || channels.some((c) => !c)) {
        throw new Error(`${where}: channels must be broadcaster names`);
      }
      const home = findTeam(entry.home ?? '', competition.teams);
      const away = findTeam(entry.away ?? '', competition.teams);
      if (!home || !away) {
        throw new Error(
          `${where}: "${entry.home}" or "${entry.away}" is not a ${slug} team code`,
        );
      }
      const match = findMatch(competition.matches, entry.date, home, away);
      if (!match) {
        log.push(
          `::warning::${where}: no ${entry.home} x ${entry.away} game on ${entry.date}`,
        );
        return;
      }
      for (const channel of channels) {
        if (!match.channels.includes(channel)) match.channels.push(channel);
      }
      added++;
    });
    log.push(`${competition.name}: ${added} curated broadcasts`);
  }
  return log;
}
