import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectSerieA } from './brasileirao/collect';
import { fixturesIO, type SourceIO } from './source';

const NOW = Date.parse('2026-11-12T20:00:00-03:00');

/** Pages in memory, keyed by fixture name; records what was asked. */
function memoryIO(files: Record<string, string>) {
  const asked: string[] = [];
  const page = (fixture: string) => {
    asked.push(fixture);
    return files[fixture] ?? null;
  };
  const io: SourceIO = {
    offline: true,
    get: async (_url, fixture) => {
      const body = page(fixture);
      if (body === null) throw new Error(`missing ${fixture}`);
      return body;
    },
    find: async (_url, fixture) => page(fixture),
    post: async (_url, _body, fixture) => page(fixture),
  };
  return { io, asked };
}

const tablePage = `<script>
  const contentResource = { tUUID: "d1a37fa4-e948-43a6-ba53-ab24ab3a45b1" }
  const fase = {"slug":"fase-unica-campeonato-brasileiro-2026"};
  const classificacao = {"rodada":{"atual":35,"ultima":38}};
</script>`;

const team = (id: number, name: string, code: string, ordem: number) => ({
  ordem,
  equipe_id: id,
  nome_popular: name,
  sigla: code,
  escudo: null,
  pontos: 0,
  jogos: 0,
  vitorias: 0,
  empates: 0,
  derrotas: 0,
  gols_pro: 0,
  gols_contra: 0,
});

const round35 = JSON.stringify([
  {
    id: 346365,
    data_realizacao: '2026-11-14T18:30',
    equipes: {
      mandante: { id: 2305, nome_popular: 'Mirassol', sigla: 'MIR' },
      visitante: { id: 282, nome_popular: 'Atlético-MG', sigla: 'CAM' },
    },
    sede: { nome_popular: 'Maião' },
    transmissao: {
      url: 'https://ge.globo.com/jogo/mirassol-atletico-mg.ghtml',
      broadcast: { id: 'PRE_DIA' },
    },
    jogo_ja_comecou: false,
  },
]);

describe('collectors over a SourceIO', () => {
  it('builds the Brasileirão from its pages, asking each by name', async () => {
    const { io, asked } = memoryIO({
      'serie-a-tabela.html': tablePage,
      'serie-a-classificacao.json': JSON.stringify({
        classificacao: [
          team(2305, 'Mirassol', 'MIR', 1),
          team(282, 'Atlético-MG', 'CAM', 2),
        ],
      }),
      'serie-a-rodada-35.json': round35,
      'serie-a-jogo-346365.html':
        '<script>"liveWatchSources":[{"name":"Premiere"}]</script>',
    });

    const competition = await collectSerieA(io, NOW);

    expect(competition.teams.map((t) => t.code)).toEqual(['MIR', 'CAM']);
    expect(competition.matches).toHaveLength(1);
    expect(competition.matches[0]).toMatchObject({
      id: '346365',
      round: 35,
      channels: ['Premiere'],
      venue: 'Maião',
    });
    // Every round is asked offline; the missing ones are skipped.
    expect(asked.filter((f) => f.startsWith('serie-a-rodada-'))).toHaveLength(
      38,
    );
    expect(asked).toContain('serie-a-jogo-346365.html');
  });
});

describe('fixturesIO', () => {
  const dir = mkdtempSync(join(tmpdir(), 'onde-passa-io-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('reads saved pages and answers null for the optional missing ones', async () => {
    writeFileSync(join(dir, 'page.html'), '<p>ok</p>');
    const io = fixturesIO(dir);
    expect(io.offline).toBe(true);
    await expect(io.get('https://x', 'page.html')).resolves.toBe('<p>ok</p>');
    await expect(io.find('https://x', 'none.json')).resolves.toBeNull();
    await expect(io.post('https://x', {}, 'none.json')).resolves.toBeNull();
    await expect(io.get('https://x', 'none.html')).rejects.toThrow();
  });
});
