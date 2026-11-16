import {
  awayTeam,
  flamengo,
  footballMatch,
  homeTeam,
  palmeiras,
  scheduledMatch,
} from '../test-fixtures';
import { Match } from '../types/snapshot';
import {
  buildReminders,
  MAX_REMINDERS,
  REMINDER_LEAD_MS,
} from '../utils/reminders';

const teamsById = new Map(
  [homeTeam, awayTeam, flamengo, palmeiras].map((team) => [team.id, team]),
);
const kickoff = Date.parse(scheduledMatch.startsAt);
const longBefore = kickoff - 24 * 60 * 60 * 1000;

describe('buildReminders', () => {
  it('warns 30 minutes before kickoff, with the channels', () => {
    const [reminder] = buildReminders([scheduledMatch], teamsById, longBefore);
    expect(reminder).toEqual({
      id: 'match-100',
      matchId: '100',
      fireAt: kickoff - REMINDER_LEAD_MS,
      title: 'Sada Cruzeiro x Vôlei Renata em 30 min',
      body: 'Superliga M · 20:30 · Onde passa: GE TV',
    });
  });

  it('says when the broadcaster is not known yet', () => {
    const match: Match = {
      ...footballMatch,
      status: 'scheduled',
      channels: [],
    };
    const [reminder] = buildReminders(
      [match],
      teamsById,
      Date.parse(match.startsAt) - 24 * 60 * 60 * 1000,
    );
    expect(reminder.title).toBe('Flamengo x Palmeiras em 30 min');
    expect(reminder.body).toBe('Brasileirão · 18:30 · Transmissão a confirmar');
  });

  it('skips matches that are not scheduled or too close to warn', () => {
    const tooClose = kickoff - REMINDER_LEAD_MS + 1;
    expect(buildReminders([scheduledMatch], teamsById, tooClose)).toEqual([]);
    expect(
      buildReminders(
        [{ ...scheduledMatch, status: 'postponed' }],
        teamsById,
        longBefore,
      ),
    ).toEqual([]);
  });

  it('skips matches of unknown teams', () => {
    expect(
      buildReminders(
        [{ ...scheduledMatch, homeTeamId: '999' }],
        teamsById,
        longBefore,
      ),
    ).toEqual([]);
  });

  it('keeps the soonest ones within the system limit', () => {
    const matches = Array.from({ length: MAX_REMINDERS + 5 }, (_, index) => ({
      ...scheduledMatch,
      id: String(index),
      startsAt: new Date(kickoff + (70 - index) * 3600_000).toISOString(),
    }));
    const reminders = buildReminders(matches, teamsById, longBefore);
    expect(reminders).toHaveLength(MAX_REMINDERS);
    expect(reminders[0].matchId).toBe('64');
    expect(reminders[0].fireAt).toBeLessThan(reminders[1].fireAt);
  });
});
