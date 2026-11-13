import { getTeamName, teamSearchText } from '../utils/teamName';

describe('getTeamName', () => {
  it('uses the short name fans know', () => {
    expect(getTeamName('SADA CRUZEIRO VOLEI')).toBe('Cruzeiro');
    expect(getTeamName('DENTIL PRAIA CLUBE')).toBe('Praia Clube');
    expect(getTeamName('SANCOR SEGUROS VOLEI')).toBe('Londrina');
  });

  it('matches the CBV text despite accents and double spaces', () => {
    expect(getTeamName('PAULISTANO  BARUERI')).toBe('Barueri');
    expect(getTeamName('Brasília Vôlei / BRB')).toBe('Brasília');
  });

  it('takes an unknown name out of capitals, keeping acronyms', () => {
    expect(getTeamName('UNIVERSIDADE DE BRASÍLIA')).toBe(
      'Universidade de Brasília',
    );
    expect(getTeamName('SESI SÃO PAULO U21')).toBe('Sesi São Paulo U21');
    expect(getTeamName('A.D. SÃO CAETANO/SP')).toBe('A.D. São Caetano/SP');
  });

  it('keeps a name that is already in mixed case', () => {
    expect(getTeamName('LOVB Madison (EUA)')).toBe('LOVB Madison (EUA)');
  });
});

describe('teamSearchText', () => {
  it('lets a search find the full or the short name', () => {
    const text = teamSearchText('SANCOR SEGUROS VOLEI', 'SSV');
    expect(text).toContain('Londrina');
    expect(text).toContain('SANCOR');
    expect(text).toContain('SSV');
  });
});
