import { STANDINGS_COLUMNS } from '@/shared/config/competitions';
import { describeMatch, describeStanding } from './accessibility';
import { finishedMatch, scheduledMatch } from '@/test/fixtures';

describe('describeMatch', () => {
  it('reads the clubs, the details and the channel as one sentence', () => {
    expect(
      describeMatch({
        match: scheduledMatch,
        homeName: 'SADA CRUZEIRO',
        awayName: 'VOLEI RENATA',
        details: ['20:30', '3ª rodada'],
      }),
    ).toBe(
      'Sada Cruzeiro contra Vôlei Renata, 20:30, 3ª rodada, passa no GE TV',
    );
  });

  it('says the score with "a" instead of the × sign', () => {
    expect(
      describeMatch({
        match: finishedMatch,
        homeName: 'SADA CRUZEIRO',
        awayName: 'VOLEI RENATA',
        favorite: true,
      }),
    ).toBe(
      'Sada Cruzeiro 3 a 1 Vôlei Renata, encerrado, jogo do seu time, passa no SporTV 2',
    );
  });

  it('says an unknown broadcast only before kickoff', () => {
    expect(
      describeMatch({
        match: { ...scheduledMatch, channels: [] },
        homeName: 'A',
        awayName: 'B',
      }),
    ).toBe('A contra B, transmissão a definir');
    expect(
      describeMatch({
        match: { ...scheduledMatch, status: 'live', channels: [] },
        homeName: 'A',
        awayName: 'B',
      }),
    ).toBe('A contra B, ao vivo');
  });
});

describe('describeStanding', () => {
  it('names every column of the sport', () => {
    expect(
      describeStanding(
        {
          teamId: '1',
          position: 5,
          points: 54,
          matches: 35,
          wins: 15,
          draws: 9,
          losses: 11,
          scoredFor: 40,
          scoredAgainst: 33,
        },
        'Athletico-PR',
        STANDINGS_COLUMNS.futebol,
        true,
      ),
    ).toBe(
      '5º, Athletico-PR, 54 pontos, 35 jogos, 15 vitórias, 9 empates, 11 derrotas, 7 saldo de gols, seu time',
    );
  });

  it('uses the singular for one', () => {
    expect(
      describeStanding(
        {
          teamId: '1',
          position: 1,
          points: 18,
          matches: 7,
          wins: 6,
          draws: 0,
          losses: 1,
          scoredFor: 20,
          scoredAgainst: 7,
        },
        'Cruzeiro',
        STANDINGS_COLUMNS.volei,
      ),
    ).toBe(
      '1º, Cruzeiro, 18 pontos, 7 jogos, 6 vitórias, 1 derrota, 20 sets vencidos, 7 sets perdidos',
    );
  });
});
