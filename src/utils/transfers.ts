import { Team, Transfer } from '../types/superliga';
import { normalizeForSearch } from './search';
import { teamSearchText } from './teamName';

export type TransferDirection = 'in' | 'out';

/** How a transfer touches the favorite team, if at all. */
export function getFavoriteDirection(
  transfer: Transfer,
  favoriteTeamId: string | undefined,
): TransferDirection | null {
  if (!favoriteTeamId) return null;
  if (transfer.to.teamId === favoriteTeamId) return 'in';
  if (transfer.from.teamId === favoriteTeamId) return 'out';
  return null;
}

/** Splits into the favorite's transfers and everyone else's, keeping order. */
export function splitByFavorite(
  transfers: Transfer[],
  favoriteTeamId: string | undefined,
): { mine: Transfer[]; others: Transfer[] } {
  const mine: Transfer[] = [];
  const others: Transfer[] = [];
  for (const transfer of transfers) {
    if (getFavoriteDirection(transfer, favoriteTeamId)) mine.push(transfer);
    else others.push(transfer);
  }
  return { mine, others };
}

/** A team's arrivals and departures, keeping order. */
export function splitByTeam(
  transfers: Transfer[],
  teamId: string,
): { arrivals: Transfer[]; departures: Transfer[] } {
  const arrivals: Transfer[] = [];
  const departures: Transfer[] = [];
  for (const transfer of transfers) {
    const direction = getFavoriteDirection(transfer, teamId);
    if (direction === 'in') arrivals.push(transfer);
    else if (direction === 'out') departures.push(transfer);
  }
  return { arrivals, departures };
}

/** Superliga teams whose name or code contains the query. */
export function findTeams(teams: Team[], query: string): Team[] {
  const term = normalizeForSearch(query);
  if (!term) return [];
  return teams.filter((team) =>
    normalizeForSearch(teamSearchText(team.name, team.code)).includes(term),
  );
}

export function filterTransfers(
  transfers: Transfer[],
  query: string,
): Transfer[] {
  const term = normalizeForSearch(query);
  if (!term) return transfers;
  return transfers.filter((transfer) =>
    normalizeForSearch(
      [
        transfer.athleteName,
        transfer.position ?? '',
        teamSearchText(transfer.from.name),
        teamSearchText(transfer.to.name),
      ].join(' '),
    ).includes(term),
  );
}

/** `https://www.lance.com.br/volei/x` → `lance.com.br`. */
export function getSourceName(url: string): string {
  return url.match(/^https?:\/\/(?:www\.)?([^/?#]+)/)?.[1] ?? url;
}

/** `2026-10-28` → `28/10`. A calendar date, so reading the text is safe. */
export function formatTransferDate(date: string): string {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}
