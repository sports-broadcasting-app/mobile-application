import type { Match, Sport } from '../src/types/snapshot';

/**
 * The game window: from 30 minutes before kickoff to 30 minutes after the
 * expected end, or while the game is live. The Cloudflare Worker that starts
 * the collection (infra/cloudflare/data-trigger/worker.js) uses the same rule
 * to choose live runs; keep both in sync.
 */
const HOUR_MS = 60 * 60 * 1000;
export const WINDOW_MARGIN_MS = 30 * 60 * 1000;

export const MATCH_LENGTH_MS: Record<Sport, number> = {
  volei: 2.5 * HOUR_MS,
  futebol: 2.5 * HOUR_MS,
  'futebol-americano': 4 * HOUR_MS,
  basquete: 3 * HOUR_MS,
  // A Formula 1 race takes about 2 h; practice and qualifying less.
  automobilismo: 2 * HOUR_MS,
};

/**
 * A game still marked live this long after its expected end is stuck at the
 * source (CBV left a Superliga game live for days, Nov 2026): it stops
 * opening the window, or live runs would go on all night.
 */
export const STALE_LIVE_MS = 6 * HOUR_MS;

/** A game or a race session: what the window needs from either. */
type Scheduled = Pick<Match, 'status' | 'startsAt'>;

export function inLiveWindow(
  match: Scheduled,
  sport: Sport,
  now: number,
): boolean {
  const start = Date.parse(match.startsAt);
  if (match.status === 'live') {
    return now <= start + MATCH_LENGTH_MS[sport] + STALE_LIVE_MS;
  }
  if (match.status === 'postponed' || match.status === 'finished') {
    return false;
  }
  return (
    now >= start - WINDOW_MARGIN_MS &&
    now <= start + MATCH_LENGTH_MS[sport] + WINDOW_MARGIN_MS
  );
}

/** Whether any of these games is in its window (a round to ask in a live run). */
export function anyInLiveWindow(
  games: Scheduled[],
  sport: Sport,
  now: number,
): boolean {
  return games.some((m) => inLiveWindow(m, sport, now));
}

/**
 * The competitions a live run refreshes, from the workflow inputs; null means
 * a full run (also when live comes without a list, to be safe).
 */
export function liveCompetitions(
  mode: string | undefined,
  list: string | undefined,
): Set<string> | null {
  if (mode !== 'live') return null;
  const slugs = (list ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return slugs.length > 0 ? new Set(slugs) : null;
}

/**
 * Splits the sources of a run: in a live run, a source with no listed
 * competition is not asked and its competitions stay as published (with
 * their own `updatedAt`). A source missing from the published file is always
 * collected.
 */
export function planSources<
  S extends { slugs: string[] },
  C extends { slug: string },
>(
  sources: S[],
  live: Set<string> | null,
  previous: { competitions: C[] } | null,
): { collect: S[]; kept: C[] } {
  if (!live || !previous) return { collect: sources, kept: [] };
  const collect: S[] = [];
  const kept: C[] = [];
  for (const source of sources) {
    const old = source.slugs.map((slug) =>
      previous.competitions.find((c) => c.slug === slug),
    );
    const wanted = source.slugs.some((slug) => live.has(slug));
    if (wanted || old.some((c) => c === undefined)) collect.push(source);
    else kept.push(...(old as C[]));
  }
  return { collect, kept };
}
