import type { MatchEvent } from '@/shared/api/snapshot';
import {
  describeEvent,
  eventPeriods,
  formatMinute,
  goalsByPeriod,
} from './matchEvents';

const event = (over: Partial<MatchEvent>): MatchEvent => ({
  type: 'goal',
  side: 'home',
  player: 'Jorginho',
  period: '1T',
  minute: 26,
  ...over,
});

describe('formatMinute', () => {
  it('shows regular minutes and stoppage time', () => {
    expect(formatMinute(event({ minute: 26 }))).toBe("26'");
    expect(formatMinute(event({ minute: 45 }))).toBe("45'");
    expect(formatMinute(event({ period: '2T', minute: 48 }))).toBe("45+3'");
    // Extra time has its own length: no stoppage notation there.
    expect(formatMinute(event({ period: '1P', minute: 16 }))).toBe("16'");
  });
});

describe('goalsByPeriod', () => {
  it('counts goals per half, always showing both halves', () => {
    const events = [
      event({ side: 'away', minute: 10 }),
      event({ type: 'own-goal', side: 'home', minute: 20 }),
      event({ type: 'red-card', side: 'away', period: '2T', minute: 30 }),
    ];
    expect(eventPeriods(events)).toEqual(['1T', '2T']);
    expect(goalsByPeriod(events)).toEqual([
      { period: '1T', home: 1, away: 1 },
      { period: '2T', home: 0, away: 0 },
    ]);
  });

  it('adds extra time when it has events', () => {
    expect(eventPeriods([event({ period: '1P' })])).toEqual(['1T', '2T', '1P']);
  });
});

describe('describeEvent', () => {
  it('says what happened, to whom and when', () => {
    expect(describeEvent(event({}), 'Flamengo')).toBe(
      'Gol de Jorginho, Flamengo, aos 26 minutos do 1º tempo',
    );
    expect(
      describeEvent(event({ type: 'own-goal', player: 'Léo' }), 'Flamengo'),
    ).toBe(
      'Gol contra de Léo, a favor do Flamengo, aos 26 minutos do 1º tempo',
    );
  });
});
