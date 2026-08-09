import { describe, expect, it } from 'vitest';
import { compareTimestamps, toComponentId, toTimestamp } from '../src/ids.js';

describe('branded ids', () => {
  it('rejects an empty string', () => {
    expect(() => toComponentId('')).toThrow(TypeError);
    expect(() => toComponentId('   ')).toThrow(TypeError);
  });

  it('accepts a non-empty string', () => {
    expect(toComponentId('sdk-a')).toBe('sdk-a');
  });
});

describe('Timestamp', () => {
  it('rejects a non-ISO string', () => {
    expect(() => toTimestamp('not-a-date')).toThrow(TypeError);
  });

  it('accepts a valid ISO-8601 string', () => {
    expect(toTimestamp('2026-01-01T00:00:00.000Z')).toBe('2026-01-01T00:00:00.000Z');
  });

  it('compareTimestamps orders chronologically', () => {
    const earlier = toTimestamp('2026-01-01T00:00:00.000Z');
    const later = toTimestamp('2026-06-01T00:00:00.000Z');
    expect(compareTimestamps(earlier, later)).toBe(-1);
    expect(compareTimestamps(later, earlier)).toBe(1);
    expect(compareTimestamps(earlier, earlier)).toBe(0);
  });
});
