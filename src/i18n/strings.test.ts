import { describe, expect, it } from 'vitest';
import { tx } from './strings';

describe('tx', () => {
  it('returns plain strings as they are', () => {
    expect(tx('Hallo', 'en')).toBe('Hallo');
  });
  it('picks the requested language', () => {
    expect(tx({ de: 'Hallo', en: 'Hello' }, 'en')).toBe('Hello');
  });
  it('falls back to the other language when one is missing', () => {
    expect(tx({ de: 'Hallo' }, 'en')).toBe('Hallo');
    expect(tx({ en: 'Hello' }, 'de')).toBe('Hello');
  });
  it('handles undefined', () => {
    expect(tx(undefined, 'de')).toBe('');
  });
});
