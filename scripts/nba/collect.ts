import type { CompetitionData } from '../../src/types/snapshot';
import {
  collectMultisport,
  type MultisportLeague,
} from '../multisport/collect.ts';

export const NBA: MultisportLeague = {
  slug: 'nba',
  sport: 'basquete',
  name: 'NBA',
  pageUrl: 'https://ge.globo.com/basquete/nba/classificacao/',
  // ge already uses the league codes (LAL, GSW, NYK).
  codes: {},
  matchLengthMs: 3 * 60 * 60 * 1000,
  // ge numbers every game day as a round; fans know the phase instead.
  roundLabel: (phase) => phase.name,
  knockoutRounds: 7,
};

/**
 * NBA from ge: the regular season by conference, the play-in and the
 * best-of-seven playoff series. Offline, reads `nba-classificacao.html` and
 * `nba-{phase}-rodada-{n}.json`.
 */
export function collectNba(
  fixturesDir?: string,
  now = Date.now(),
  previous?: CompetitionData,
  options: { live?: boolean } = {},
): Promise<CompetitionData> {
  return collectMultisport(NBA, fixturesDir, now, previous, options);
}
