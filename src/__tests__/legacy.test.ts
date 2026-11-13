import { toLegacySnapshot } from '../../scripts/legacy';
import {
  buildSnapshot,
  finishedMatch,
  footballCompetition,
} from '../test-fixtures';

describe('toLegacySnapshot', () => {
  it('rewrites the Superligas in the shape the first release reads', () => {
    const snapshot = buildSnapshot([finishedMatch]);
    snapshot.competitions.push(footballCompetition);

    const legacy = toLegacySnapshot(snapshot);
    expect(legacy.version).toBe(1);
    expect(legacy.season).toBe('2026/27');
    expect(legacy.competitions.map((c) => c.slug)).toEqual([
      'masculina',
      'feminina',
    ]);

    const [match] = legacy.competitions[0].matches;
    expect(match).toMatchObject({ homeSets: 3, awaySets: 1 });
    expect(match).not.toHaveProperty('homeScore');

    const [standing] = legacy.competitions[0].standings;
    expect(standing).toMatchObject({ setsWon: 9, setsLost: 1, pointsWon: 0 });
    expect(standing).not.toHaveProperty('draws');
    expect(legacy.competitions[0].transfers).toHaveLength(3);
  });
});
