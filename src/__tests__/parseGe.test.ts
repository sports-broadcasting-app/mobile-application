import {
  parseChannels,
  parseRound,
  parseStandings,
  parseTablePage,
  toInstant,
} from '../../scripts/brasileirao/parseGe';

const NOW = Date.parse('2026-11-12T20:00:00-03:00');

const tablePage = `
  <script>
    const contentResource = {
      tUUID: "d1a37fa4-e948-43a6-ba53-ab24ab3a45b1",
      esporte: "futebol",
    }
    const fase = {"disclaimer":"","slug":"fase-unica-campeonato-brasileiro-2026","tipo":{"descricao":"Pontos Corridos"}};
    const classificacao = {"classificacao":[],"edicao":{"data_fim":"2026-12-02","nome":"Campeonato Brasileiro 2026"},"rodada":{"atual":35,"ultima":38}};
  </script>`;

function rawMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: 346365,
    data_realizacao: '2026-11-14T18:30',
    hora_realizacao: '18:30',
    placar_oficial_mandante: null,
    placar_oficial_visitante: null,
    equipes: {
      mandante: {
        id: 2305,
        nome_popular: 'Mirassol',
        sigla: 'MIR',
        escudo: 'https://s.sde.globo.com/mirassol.svg',
      },
      visitante: {
        id: 282,
        nome_popular: 'Atlético-MG',
        sigla: 'CAM',
        escudo: 'https://s.sde.globo.com/cam.svg',
      },
    },
    sede: { nome_popular: 'Maião' },
    transmissao: {
      url: 'https://ge.globo.com/jogo/14-11-2026/mirassol-atletico-mg.ghtml',
      broadcast: { id: 'PRE_DIA', label: 'fique por dentro' },
    },
    jogo_ja_comecou: false,
    ...overrides,
  };
}

const standingsJson = JSON.stringify({
  classificacao: [
    {
      ordem: 2,
      pontos: 73,
      nome_popular: 'Palmeiras',
      sigla: 'PAL',
      vitorias: 21,
      escudo: 'https://s.sde.globo.com/palmeiras.svg',
      equipe_id: 275,
      jogos: 34,
      derrotas: 3,
      gols_pro: 62,
      gols_contra: 23,
      empates: 10,
    },
    {
      ordem: 1,
      pontos: 76,
      nome_popular: 'Flamengo',
      sigla: 'FLA',
      vitorias: 23,
      escudo: 'https://s.sde.globo.com/flamengo.svg',
      equipe_id: 262,
      jogos: 34,
      derrotas: 4,
      gols_pro: 71,
      gols_contra: 29,
      empates: 7,
    },
  ],
});

describe('parseGe', () => {
  it('reads the table ids and rounds from the championship page', () => {
    expect(parseTablePage(tablePage)).toEqual({
      tableId: 'd1a37fa4-e948-43a6-ba53-ab24ab3a45b1',
      phaseSlug: 'fase-unica-campeonato-brasileiro-2026',
      editionName: 'Campeonato Brasileiro 2026',
      currentRound: 35,
      lastRound: 38,
    });
  });

  it('refuses a page without the table ids', () => {
    expect(() => parseTablePage('<html></html>')).toThrow(/table ids/);
  });

  it('gives Brasília times their offset', () => {
    expect(toInstant('2026-11-14T18:30')).toBe('2026-11-14T18:30:00-03:00');
    expect(toInstant('a definir')).toBeNull();
  });

  it('parses a scheduled match with its page link', () => {
    const { matches, teams } = parseRound(
      JSON.stringify([rawMatch()]),
      35,
      'serie-a',
      NOW,
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].match).toEqual({
      id: '346365',
      competition: 'serie-a',
      startsAt: '2026-11-14T18:30:00-03:00',
      round: 35,
      roundLabel: '35ª rodada',
      homeTeamId: '2305',
      awayTeamId: '282',
      status: 'scheduled',
      homeScore: null,
      awayScore: null,
      setScores: [],
      channels: [],
      venue: 'Maião',
      city: null,
    });
    expect(matches[0].pageUrl).toContain('mirassol-atletico-mg');
    expect(teams.map((team) => team.code)).toEqual(['MIR', 'CAM']);
  });

  it('marks finished and live matches with their score', () => {
    const finished = rawMatch({
      data_realizacao: '2026-11-06T20:00',
      placar_oficial_mandante: 0,
      placar_oficial_visitante: 3,
      transmissao: { url: null, broadcast: { id: 'ENCERRADA' } },
      jogo_ja_comecou: true,
    });
    const live = rawMatch({
      id: 2,
      data_realizacao: '2026-11-12T19:00',
      placar_oficial_mandante: 1,
      placar_oficial_visitante: 1,
      transmissao: null,
      jogo_ja_comecou: true,
    });
    const longOver = rawMatch({
      id: 3,
      data_realizacao: '2026-11-11T19:00',
      placar_oficial_mandante: 2,
      placar_oficial_visitante: 0,
      transmissao: null,
      jogo_ja_comecou: true,
    });
    const { matches } = parseRound(
      JSON.stringify([finished, live, longOver]),
      34,
      'serie-a',
      NOW,
    );
    expect(matches.map(({ match }) => [match.status, match.homeScore])).toEqual(
      [
        ['finished', 0],
        ['live', 1],
        ['finished', 2],
      ],
    );
  });

  it('skips a match without a date or a team', () => {
    const noDate = rawMatch({ data_realizacao: null });
    const noTeam = rawMatch({ id: 2, equipes: { mandante: null } });
    expect(
      parseRound(JSON.stringify([noDate, noTeam]), 1, 'serie-a', NOW).matches,
    ).toEqual([]);
  });

  it('orders the standings and keeps the goals', () => {
    const { teams, standings } = parseStandings(standingsJson);
    expect(teams.map((team) => team.name)).toEqual(['Palmeiras', 'Flamengo']);
    expect(teams[1]).toEqual({
      id: '262',
      name: 'Flamengo',
      code: 'FLA',
      badgeUrl: 'https://s.sde.globo.com/flamengo.svg',
    });
    expect(standings[0]).toEqual({
      teamId: '262',
      position: 1,
      points: 76,
      matches: 34,
      wins: 23,
      draws: 7,
      losses: 4,
      scoredFor: 71,
      scoredAgainst: 29,
    });
  });

  it('keeps only the broadcasters of a match page', () => {
    const page = `window.trv2 = { transmission: {"id":1,"liveWatchSources":[
      {"__typename":"EventsLiveWatchSource","name":"Premiere","url":"https:\\/\\/premiere.globo.com\\/"},
      {"__typename":"EventsLiveWatchSource","name":"globoplay","description":"Plano Premium"},
      {"__typename":"EventsLiveWatchSource","name":"Cartola","description":"Seja PRO"},
      {"__typename":"EventsLiveWatchSource","name":"Prime V\\u00eddeo"},
      {"__typename":"EventsLiveWatchSource","name":"Premiere"}
    ],"location":{}} }`;
    expect(parseChannels(page)).toEqual([
      'Premiere',
      'Globoplay',
      'Prime Video',
    ]);
  });

  it('has no channels for a page without the list', () => {
    expect(parseChannels('<html>sem transmissão</html>')).toEqual([]);
  });
});
