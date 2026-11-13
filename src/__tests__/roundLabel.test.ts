import { formatRound } from '../utils/roundLabel';

describe('formatRound', () => {
  it('shortens the CBV round labels', () => {
    expect(formatRound('TURNO - RODADA 5')).toBe('5ª rodada');
    expect(formatRound('RETURNO - RODADA 2')).toBe('2ª rodada · returno');
  });

  it('keeps ge labels and tames capitals elsewhere', () => {
    expect(formatRound('35ª rodada')).toBe('35ª rodada');
    expect(formatRound('QUARTAS DE FINAL')).toBe('Quartas de final');
    expect(formatRound('')).toBe('');
  });
});
