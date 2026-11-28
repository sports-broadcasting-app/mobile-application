import type {
  Match,
  RaceSession,
  Snapshot,
  Standing,
  Team,
  Transfer,
} from '../api/snapshot';
// With the extension: the collector runs this file in Node too.
import { asList, isObject } from './json.ts';

/**
 * Checks for data the app and the collector read back: the published file,
 * and rows the app saved itself. They look at what every reader relies on
 * (ids, dates, the lists), not every field, since the collector validates
 * the whole file before publishing (scripts/validate.ts).
 */

const isText = (value: unknown): value is string => typeof value === 'string';

/** The published file as every build since 1.0 reads it. */
export function isSnapshot(value: unknown): value is Snapshot {
  if (!isObject(value) || value.version !== 2) return false;
  const { competitions, series } = value;
  return (
    Array.isArray(competitions) &&
    competitions.every(
      (c) =>
        isObject(c) && asList(c.teams).length > 0 && Array.isArray(c.matches),
    ) &&
    (series === undefined ||
      (Array.isArray(series) &&
        series.every((s) => isObject(s) && Array.isArray(s.sessions))))
  );
}

export const isTeam = (value: unknown): value is Team =>
  isObject(value) && isText(value.id) && isText(value.name);

export const isMatch = (value: unknown): value is Match =>
  isObject(value) &&
  isText(value.id) &&
  isText(value.startsAt) &&
  isText(value.homeTeamId) &&
  isText(value.awayTeamId) &&
  Array.isArray(value.channels);

export const isRaceSession = (value: unknown): value is RaceSession =>
  isObject(value) &&
  isText(value.id) &&
  isText(value.grandPrixId) &&
  isText(value.startsAt) &&
  Array.isArray(value.channels);

export const isStanding = (value: unknown): value is Standing =>
  isObject(value) && isText(value.teamId) && typeof value.position === 'number';

export const isTransfer = (value: unknown): value is Transfer =>
  isObject(value) && isText(value.id) && isText(value.athleteName);
