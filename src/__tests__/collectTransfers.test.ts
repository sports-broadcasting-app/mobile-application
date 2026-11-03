import {
  resolveTransfers,
  TransferEntry,
} from '../../scripts/superliga/transfers';
import { awayTeam, homeTeam } from '../test-fixtures';

const teams = [homeTeam, awayTeam];
const entry: TransferEntry = {
  athlete: 'Ana Souza ',
  position: 'Ponteira',
  from: 'ren',
  to: 'Clube Livre',
  date: '2026-10-28',
  source: 'https://www.lance.com.br/volei/ana-souza.html',
};

describe('resolveTransfers', () => {
  it('turns team codes into Superliga teams and keeps other clubs by name', () => {
    expect(resolveTransfers('masculina', [entry], teams)).toEqual([
      {
        id: 'ana-souza-clube-livre',
        athleteName: 'Ana Souza',
        position: 'Ponteira',
        from: { teamId: '2', name: 'VOLEI RENATA' },
        to: { teamId: null, name: 'Clube Livre' },
        date: '2026-10-28',
        loan: false,
        sourceUrl: 'https://www.lance.com.br/volei/ana-souza.html',
      },
    ]);
  });

  it('also accepts the full team name, ignoring accents', () => {
    const [transfer] = resolveTransfers(
      'masculina',
      [{ ...entry, to: 'Vôlei Renata', from: 'Modena' }],
      teams,
    );
    expect(transfer.to.teamId).toBe('2');
  });

  it.each([
    [{ source: 'lance.com.br' }, 'source must be the article URL'],
    [{ date: '28/10/2026' }, 'date must be YYYY-MM-DD'],
    [{ athlete: ' ' }, 'missing athlete'],
    [{ from: 'XYZ', to: 'Modena' }, 'is a masculina team code'],
  ])('rejects a doubtful line %#', (change, message) => {
    expect(() =>
      resolveTransfers('masculina', [{ ...entry, ...change }], teams),
    ).toThrow(message);
  });

  it('rejects the same transfer twice', () => {
    expect(() => resolveTransfers('masculina', [entry, entry], teams)).toThrow(
      'duplicated',
    );
  });
});
