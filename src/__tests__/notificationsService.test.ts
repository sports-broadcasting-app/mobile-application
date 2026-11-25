import * as Notifications from 'expo-notifications';
import { replaceScheduledReminders } from '../services/notifications';
import type { Reminder } from '../utils/reminders';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
}));

const getAll = Notifications.getAllScheduledNotificationsAsync as jest.Mock;
const cancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const cancelAll =
  Notifications.cancelAllScheduledNotificationsAsync as jest.Mock;
const schedule = Notifications.scheduleNotificationAsync as jest.Mock;

function reminder(id: string, fireAt = 1_000): Reminder {
  return {
    id,
    matchId: id,
    path: `/match/${id}`,
    fireAt,
    title: `t-${id}`,
    body: `b-${id}`,
  };
}

/** A pending request as the app scheduled it. */
function pending(r: Reminder) {
  return {
    identifier: r.id,
    content: {
      title: r.title,
      body: r.body,
      data: { matchId: r.matchId, path: r.path, fireAt: r.fireAt },
    },
    trigger: null,
  };
}

describe('replaceScheduledReminders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('keeps unchanged reminders and only adds the new ones', async () => {
    getAll.mockResolvedValue([pending(reminder('a'))]);

    await replaceScheduledReminders([reminder('a'), reminder('b')]);

    expect(cancelAll).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
    expect(schedule).toHaveBeenCalledTimes(1);
    expect(schedule.mock.calls[0][0]).toMatchObject({
      identifier: 'b',
      content: { data: { matchId: 'b', fireAt: 1_000 } },
    });
  });

  it('reschedules a reminder whose time changed', async () => {
    getAll.mockResolvedValue([pending(reminder('a', 1_000))]);

    await replaceScheduledReminders([reminder('a', 2_000)]);

    expect(cancel).toHaveBeenCalledWith('a');
    expect(schedule).toHaveBeenCalledTimes(1);
  });

  it('cancels reminders that are no longer wanted', async () => {
    getAll.mockResolvedValue([pending(reminder('a')), pending(reminder('b'))]);

    await replaceScheduledReminders([reminder('b')]);

    expect(cancel).toHaveBeenCalledWith('a');
    expect(cancel).not.toHaveBeenCalledWith('b');
    expect(schedule).not.toHaveBeenCalled();
  });

  it('replaces requests scheduled by older versions (no fireAt)', async () => {
    const old = pending(reminder('a'));
    old.content.data = { matchId: 'a' } as typeof old.content.data;
    getAll.mockResolvedValue([old]);

    await replaceScheduledReminders([reminder('a')]);

    expect(cancel).toHaveBeenCalledWith('a');
    expect(schedule).toHaveBeenCalledTimes(1);
  });
});
