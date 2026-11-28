import { fingerprint } from './hash';

describe('fingerprint', () => {
  it('is the same for the same text', () => {
    expect(fingerprint('{"a":1}')).toBe(fingerprint('{"a":1}'));
  });

  it('changes with one character', () => {
    expect(fingerprint('{"a":1}')).not.toBe(fingerprint('{"a":2}'));
  });

  it('ends with the length in base 36', () => {
    expect(fingerprint('x'.repeat(36))).toMatch(/-10$/);
  });
});
