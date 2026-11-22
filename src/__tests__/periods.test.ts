import { quarterColumns } from '../utils/periods';

const q = (home: number, away: number) => ({ home, away });

describe('quarterColumns', () => {
  it('labels four quarters', () => {
    expect(
      quarterColumns([q(20, 24), q(25, 26), q(30, 20), q(22, 26)]).map(
        (c) => c.label,
      ),
    ).toEqual(['1º Q', '2º Q', '3º Q', '4º Q']);
  });

  it('labels one overtime as Pr and several as Pr 1, Pr 2', () => {
    const one = quarterColumns([q(1, 1), q(1, 1), q(1, 1), q(1, 1), q(7, 6)]);
    expect(one[4]).toMatchObject({ label: 'Pr', name: 'prorrogação' });
    const two = quarterColumns([
      q(1, 1),
      q(1, 1),
      q(1, 1),
      q(1, 1),
      q(5, 5),
      q(9, 4),
    ]);
    expect(two.slice(4).map((c) => c.label)).toEqual(['Pr 1', 'Pr 2']);
    expect(two[5].name).toBe('2ª prorrogação');
  });
});
