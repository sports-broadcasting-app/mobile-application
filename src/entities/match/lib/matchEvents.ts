import type { MatchEvent } from '@/shared/api/snapshot';

const PERIOD_NAMES: Record<string, { name: string; short: string }> = {
  '1T': { name: '1º tempo', short: '1º T' },
  '2T': { name: '2º tempo', short: '2º T' },
  '1P': { name: '1º tempo da prorrogação', short: '1º P' },
  '2P': { name: '2º tempo da prorrogação', short: '2º P' },
  PEN: { name: 'Pênaltis', short: 'Pên.' },
};

/** "1º tempo"; an unknown ge code is shown as it comes. */
export function periodName(period: string): string {
  return PERIOD_NAMES[period]?.name ?? period;
}

/** "1º T", for a scoreboard column. */
export function periodShortName(period: string): string {
  return PERIOD_NAMES[period]?.short ?? period;
}

/** Regular-time periods last 45 minutes; anything after is stoppage time. */
const REGULAR_MINUTES = 45;

/** "26'", or "45+3'" for stoppage time in a regular half. */
export function formatMinute({ period, minute }: MatchEvent): string {
  const regular = period === '1T' || period === '2T';
  return regular && minute > REGULAR_MINUTES
    ? `45+${minute - REGULAR_MINUTES}'`
    : `${minute}'`;
}

/** The periods that have events, in match order, regular time always shown. */
export function eventPeriods(events: MatchEvent[]): string[] {
  const periods = ['1T', '2T'];
  for (const event of events) {
    if (!periods.includes(event.period)) periods.push(event.period);
  }
  return periods;
}

/** Goals per period and side (own goals count for the side they favor). */
export function goalsByPeriod(
  events: MatchEvent[],
): { period: string; home: number; away: number }[] {
  return eventPeriods(events).map((period) => {
    const goals = events.filter(
      (e) => e.period === period && e.type !== 'red-card',
    );
    return {
      period,
      home: goals.filter((e) => e.side === 'home').length,
      away: goals.filter((e) => e.side === 'away').length,
    };
  });
}

/** What a screen reader says for one event. */
export function describeEvent(event: MatchEvent, teamName: string): string {
  const what =
    event.type === 'goal'
      ? `Gol de ${event.player}`
      : event.type === 'own-goal'
        ? `Gol contra de ${event.player}, a favor do ${teamName}`
        : `Cartão vermelho para ${event.player}`;
  const team = event.type === 'own-goal' ? '' : `, ${teamName}`;
  const regular = event.period === '1T' || event.period === '2T';
  const when =
    regular && event.minute > REGULAR_MINUTES
      ? `aos 45 mais ${event.minute - REGULAR_MINUTES} minutos`
      : `aos ${event.minute} minutos`;
  return `${what}${team}, ${when} do ${periodName(event.period)}`;
}
