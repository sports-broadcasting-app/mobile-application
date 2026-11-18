import type { CompetitionData } from '../../src/types/snapshot';
import {
  collectMultisport,
  type MultisportLeague,
} from '../multisport/collect.ts';

/** ge abbreviates a few clubs its own way; fans know the league codes. */
export const NFL_TEAM_CODES = {
  GBP: 'GB',
  KCC: 'KC',
  LVR: 'LV',
  NEP: 'NE',
  NOS: 'NO',
  SF4: 'SF',
  TBB: 'TB',
};

export const NFL: MultisportLeague = {
  slug: 'nfl',
  sport: 'futebol-americano',
  name: 'NFL',
  pageUrl: 'https://ge.globo.com/futebol-americano/nfl/classificacao/',
  codes: NFL_TEAM_CODES,
  matchLengthMs: 4 * 60 * 60 * 1000,
  roundLabel: (phase, round) =>
    phase.knockout ? phase.name : `Semana ${round}`,
  knockoutRounds: 1,
};

/**
 * NFL from ge: weeks of the regular season by division, then the playoffs.
 * Offline, reads `nfl-classificacao.html` and `nfl-{phase}-rodada-{n}.json`.
 */
export function collectNfl(
  fixturesDir?: string,
  now = Date.now(),
  previous?: CompetitionData,
): Promise<CompetitionData> {
  return collectMultisport(NFL, fixturesDir, now, previous);
}
