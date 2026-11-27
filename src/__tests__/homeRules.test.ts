import {
  buildSections,
  chipRow,
  describeNext,
  homeTitle,
  mergeNext,
  nextTitle,
  onlySessions,
  scopeOf,
  sectionDetail,
} from '../utils/home';
import type { CompetitionSlug, Sport } from '../types/snapshot';
import { footballMatch, raceSessions, scheduledMatch } from '../test-fixtures';

const ALL: CompetitionSlug[] = ['masculina', 'feminina', 'serie-a', 'f1'];
const BY_SPORT: Partial<Record<Sport, CompetitionSlug[]>> = {
  volei: ['masculina', 'feminina'],
  futebol: ['serie-a'],
  automobilismo: ['f1'],
};
const followedIn = (sport: Sport) => BY_SPORT[sport] ?? [];

describe('Jogos rules', () => {
  it('scopes a filter to its competitions', () => {
    expect(scopeOf('todos', ALL, followedIn)).toEqual(ALL);
    expect(scopeOf('volei', ALL, followedIn)).toEqual([
      'masculina',
      'feminina',
    ]);
    expect(scopeOf('serie-a', ALL, followedIn)).toEqual(['serie-a']);
  });

  it('puts your teams first in "Todos", then a section per competition', () => {
    const sections = buildSections({
      filter: 'todos',
      scope: ALL,
      matches: [scheduledMatch, footballMatch],
      sessions: [raceSessions[0]!],
      isFavoriteMatch: (match) => match.id === scheduledMatch.id,
    });
    expect(sections.map((s) => s.key)).toEqual(['mine', 'serie-a', 'f1']);
    expect(sectionDetail(sections[0]!)).toBeUndefined();
    expect(sectionDetail(sections[1]!)).toBe('1 jogo');
    expect(sectionDetail(sections[2]!)).toBe('1 sessão');
  });

  it('shows one unnamed section for a single competition', () => {
    const [only] = buildSections({
      filter: 'serie-a',
      scope: ['serie-a'],
      matches: [footballMatch],
      sessions: [],
      isFavoriteMatch: () => true,
    });
    expect(only).toMatchObject({ key: 'all', title: '' });
  });

  it('merges coming games and sessions, soonest first', () => {
    const next = mergeNext([footballMatch], raceSessions, 2);
    expect(next.map((item) => (item.match ?? item.session).id)).toEqual([
      footballMatch.id,
      raceSessions[0]!.id,
    ]);
  });

  it('builds the chip row by sport, and swaps it for a sport with 2+', () => {
    const sports: Sport[] = ['automobilismo', 'futebol', 'volei'];
    const top = chipRow('todos', sports, followedIn);
    expect(top.split).toBe(false);
    expect(top.options.map((o) => o.label)).toEqual([
      'Todos',
      'F1',
      'Brasileirão',
      'Vôlei',
    ]);

    const volei = chipRow('volei', sports, followedIn);
    expect(volei.split).toBe(true);
    expect(volei.options.map((o) => o.value)).toEqual([
      'masculina',
      'feminina',
    ]);
    expect(volei.pick('feminina')).toBe('feminina');

    // The picked competition again goes back to the whole sport.
    expect(chipRow('feminina', sports, followedIn).pick('feminina')).toBe(
      'volei',
    );
  });

  it('names the screen and the next list', () => {
    expect(homeTitle('todos')).toBe('Jogos');
    expect(homeTitle('volei')).toBe('Vôlei');
    expect(homeTitle('feminina')).toBe('Superliga Feminina');
    expect(nextTitle('masculina', ['masculina'])).toBe(
      'Próximos jogos · Superliga M',
    );
    expect(onlySessions(['f1'])).toBe(true);
    expect(nextTitle('f1', ['f1'])).toBe('Próximas sessões');
    expect(describeNext(raceSessions)).toMatch(/^O próximo é o GP do Catar/);
    expect(describeNext([])).toBeUndefined();
  });
});
