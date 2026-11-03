import { normalizeForSearch } from '../utils/search';

describe('normalizeForSearch', () => {
  it('removes case and Portuguese accents', () => {
    expect(normalizeForSearch('  SÃO JOSÉ Vôlei  ')).toBe('sao jose volei');
    expect(normalizeForSearch('Açaí')).toBe('acai');
  });
});
