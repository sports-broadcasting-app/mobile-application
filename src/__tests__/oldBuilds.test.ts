import { toPublished } from '../../scripts/fallback';
import { toLegacySnapshot } from '../../scripts/legacy';
import { assertOldBuildsRead, OLD_BUILDS } from '../../scripts/oldBuilds';
import {
  buildF1Series,
  buildSnapshot,
  finishedMatch,
  footballCompetition,
} from '../test-fixtures';

/** What a run publishes: every competition, with Formula 1 in `series`. */
function published() {
  const { competitions } = buildSnapshot([finishedMatch]);
  return toPublished('2026-11-26T12:00:00.000Z', [
    ...competitions,
    footballCompetition,
    buildF1Series(),
  ]);
}

describe('builds already released', () => {
  it('read every file a run publishes', () => {
    const snapshot = published();
    const files = {
      'onde-passa.json': snapshot,
      'superliga.json': toLegacySnapshot(snapshot),
    };
    for (const build of OLD_BUILDS) {
      expect({
        build: build.builds,
        reads: build.reads(files[build.file]),
      }).toEqual({ build: build.builds, reads: true });
    }
    expect(() => assertOldBuildsRead(files)).not.toThrow();
  });

  it('would reject a teamless competition, so Formula 1 stays in series', () => {
    const snapshot = published();
    const broken = {
      ...snapshot,
      competitions: [...snapshot.competitions, buildF1Series()],
    };
    expect(() =>
      assertOldBuildsRead({
        'onde-passa.json': broken,
        'superliga.json': toLegacySnapshot(snapshot),
      }),
    ).toThrow(/1\.0 to 1\.2.*1\.3 to 1\.4/);
  });

  it('would reject a file without a competition they know', () => {
    const snapshot = { ...published(), competitions: [] };
    expect(() =>
      assertOldBuildsRead({
        'onde-passa.json': snapshot,
        'superliga.json': toLegacySnapshot(published()),
      }),
    ).toThrow(/1\.3 to 1\.4/);
  });

  it('keeps the first release on exactly the two Superligas', () => {
    const legacy = toLegacySnapshot(published());
    const [first] = OLD_BUILDS;
    expect(first!.reads(legacy)).toBe(true);
    expect(
      first!.reads({
        ...legacy,
        competitions: [...legacy.competitions, legacy.competitions[0]],
      }),
    ).toBe(false);
  });
});
