import { staleCompetitions } from '../../scripts/freshness';
import type { CompetitionData, Match } from '../types/snapshot';
import {
  buildF1Series,
  footballCompetition,
  footballMatch,
} from '../test-fixtures';

const NOW = Date.parse('2026-11-26T21:00:00-03:00');
const HOUR_MS = 60 * 60 * 1000;
const ago = (hours: number) => new Date(NOW - hours * HOUR_MS).toISOString();

function game(startsAt: string, status: Match['status'] = 'scheduled'): Match {
  return {
    ...footballMatch,
    status,
    startsAt,
    homeScore: null,
    awayScore: null,
  };
}

function competition(updatedAt: string, matches: Match[]): CompetitionData {
  return { ...footballCompetition, updatedAt, matches };
}

describe('staleCompetitions', () => {
  it('flags a competition with a game on that stopped updating', () => {
    // Kickoff 19:30, window open since 19:00; last update 18:00.
    const stale = staleCompetitions(
      [competition(ago(3), [game('2026-11-26T19:30:00-03:00')])],
      NOW,
    );
    expect(stale).toEqual(['Brasileirão Série A (3.0 h)']);
  });

  it('flags a game left live at the source too (the frozen Superliga)', () => {
    const live = game('2026-11-26T16:00:00-03:00', 'live');
    expect(staleCompetitions([competition(ago(2), [live])], NOW)).toHaveLength(
      1,
    );
  });

  it('leaves a game whose window just opened to the next live run', () => {
    // Kickoff 21:15: window open since 20:45, under an hour.
    const soon = game('2026-11-26T21:15:00-03:00');
    expect(staleCompetitions([competition(ago(14), [soon])], NOW)).toEqual([]);
  });

  it('accepts a competition updated in the last hour', () => {
    const on = game('2026-11-26T19:30:00-03:00');
    expect(staleCompetitions([competition(ago(0.5), [on])], NOW)).toEqual([]);
  });

  it('accepts a day without games until the next morning run is missed', () => {
    const past = game('2026-11-20T19:30:00-03:00', 'finished');
    expect(staleCompetitions([competition(ago(20), [past])], NOW)).toEqual([]);
    expect(staleCompetitions([competition(ago(27), [past])], NOW)).toEqual([
      'Brasileirão Série A (27.0 h)',
    ]);
  });

  it('counts Formula 1 sessions as games', () => {
    const series = {
      ...buildF1Series([
        {
          ...buildF1Series().sessions![0]!,
          startsAt: '2026-11-26T19:30:00-03:00',
        },
      ]),
      updatedAt: ago(2),
    };
    expect(staleCompetitions([series], NOW)).toEqual(['Fórmula 1 (2.0 h)']);
  });
});
