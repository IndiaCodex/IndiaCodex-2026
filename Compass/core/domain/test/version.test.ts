import { describe, expect, it } from 'vitest';
import { InvalidVersionError, IncompatibleVersionSchemeError, InvalidConstraintError } from '../src/errors.js';
import { compareSemVer, parseSemVer, satisfiesSemVerRange, semVerScheme } from '../src/version.js';

describe('parseSemVer', () => {
  it('parses a plain major.minor.patch version', () => {
    expect(parseSemVer('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3, prerelease: [] });
  });

  it('parses a prerelease with mixed numeric and alpha identifiers', () => {
    expect(parseSemVer('1.2.3-beta.1')).toEqual({ major: 1, minor: 2, patch: 3, prerelease: ['beta', 1] });
  });

  it('ignores build metadata', () => {
    expect(parseSemVer('1.2.3+build.5')).toEqual({ major: 1, minor: 2, patch: 3, prerelease: [] });
  });

  it.each(['1.2', 'v1.2.3', '1.2.3.4', 'not-a-version', ''])('rejects malformed input %j', (raw) => {
    expect(() => parseSemVer(raw)).toThrow(InvalidVersionError);
  });
});

describe('compareSemVer', () => {
  it('orders by major, then minor, then patch', () => {
    expect(compareSemVer(parseSemVer('2.0.0'), parseSemVer('1.9.9'))).toBe(1);
    expect(compareSemVer(parseSemVer('1.2.0'), parseSemVer('1.10.0'))).toBe(-1);
    expect(compareSemVer(parseSemVer('1.2.3'), parseSemVer('1.2.4'))).toBe(-1);
    expect(compareSemVer(parseSemVer('1.2.3'), parseSemVer('1.2.3'))).toBe(0);
  });

  it('ranks a release version above any prerelease of the same major.minor.patch', () => {
    expect(compareSemVer(parseSemVer('1.0.0'), parseSemVer('1.0.0-rc.1'))).toBe(1);
    expect(compareSemVer(parseSemVer('1.0.0-rc.1'), parseSemVer('1.0.0'))).toBe(-1);
  });

  it('compares prerelease identifiers positionally, numeric before alpha rules aside', () => {
    expect(compareSemVer(parseSemVer('1.0.0-alpha.1'), parseSemVer('1.0.0-alpha.2'))).toBe(-1);
    expect(compareSemVer(parseSemVer('1.0.0-alpha'), parseSemVer('1.0.0-alpha.1'))).toBe(-1);
    expect(compareSemVer(parseSemVer('1.0.0-alpha.1'), parseSemVer('1.0.0-alpha'))).toBe(1);
  });

  it('compares two non-numeric prerelease identifiers lexically', () => {
    expect(compareSemVer(parseSemVer('1.0.0-alpha'), parseSemVer('1.0.0-beta'))).toBe(-1);
    expect(compareSemVer(parseSemVer('1.0.0-beta'), parseSemVer('1.0.0-alpha'))).toBe(1);
  });

  it('treats identical prerelease identifiers at a position as equal and continues comparing', () => {
    expect(compareSemVer(parseSemVer('1.0.0-alpha.1'), parseSemVer('1.0.0-alpha.1'))).toBe(0);
  });

  it('compares numeric prerelease identifiers in both directions', () => {
    expect(compareSemVer(parseSemVer('1.0.0-alpha.1'), parseSemVer('1.0.0-alpha.2'))).toBe(-1);
    expect(compareSemVer(parseSemVer('1.0.0-alpha.2'), parseSemVer('1.0.0-alpha.1'))).toBe(1);
  });

  it('is antisymmetric: swapping operands negates a non-zero result and preserves equality', () => {
    const versions = ['1.0.0', '1.0.0-rc.1', '2.3.4', '2.3.4-beta.2', '0.1.0'].map(parseSemVer);
    for (const a of versions) {
      for (const b of versions) {
        const forward = compareSemVer(a, b);
        const backward = compareSemVer(b, a);
        expect(backward).toBe(forward === 0 ? 0 : forward === 1 ? -1 : 1);
      }
    }
  });
});

describe('satisfiesSemVerRange', () => {
  it('supports exact match', () => {
    expect(satisfiesSemVerRange('1.2.3', '1.2.3')).toBe(true);
    expect(satisfiesSemVerRange('1.2.4', '=1.2.3')).toBe(false);
  });

  it('supports comparison operators', () => {
    expect(satisfiesSemVerRange('2.0.0', '>=1.0.0')).toBe(true);
    expect(satisfiesSemVerRange('0.9.0', '>=1.0.0')).toBe(false);
    expect(satisfiesSemVerRange('1.0.0', '<2.0.0')).toBe(true);
    expect(satisfiesSemVerRange('2.0.0', '<2.0.0')).toBe(false);
    expect(satisfiesSemVerRange('2.0.0', '>1.0.0')).toBe(true);
    expect(satisfiesSemVerRange('1.0.0', '>1.0.0')).toBe(false);
    expect(satisfiesSemVerRange('1.0.0', '<=1.0.0')).toBe(true);
    expect(satisfiesSemVerRange('1.0.1', '<=1.0.0')).toBe(false);
  });

  it('supports caret ranges (same major, or same minor pre-1.0, or same patch pre-0.1)', () => {
    expect(satisfiesSemVerRange('1.4.2', '^1.2.0')).toBe(true);
    expect(satisfiesSemVerRange('2.0.0', '^1.2.0')).toBe(false);
    expect(satisfiesSemVerRange('1.1.9', '^1.2.0')).toBe(false);
    expect(satisfiesSemVerRange('0.2.5', '^0.2.0')).toBe(true);
    expect(satisfiesSemVerRange('0.3.0', '^0.2.0')).toBe(false);
    expect(satisfiesSemVerRange('0.0.3', '^0.0.3')).toBe(true);
    expect(satisfiesSemVerRange('0.0.4', '^0.0.3')).toBe(false);
  });

  it('supports tilde ranges (same major and minor)', () => {
    expect(satisfiesSemVerRange('1.2.9', '~1.2.0')).toBe(true);
    expect(satisfiesSemVerRange('1.3.0', '~1.2.0')).toBe(false);
    expect(satisfiesSemVerRange('1.1.9', '~1.2.0')).toBe(false);
  });

  it('supports multiple space-separated clauses combined with AND', () => {
    expect(satisfiesSemVerRange('1.5.0', '>=1.0.0 <2.0.0')).toBe(true);
    expect(satisfiesSemVerRange('2.5.0', '>=1.0.0 <2.0.0')).toBe(false);
  });

  it('rejects an empty range', () => {
    expect(() => satisfiesSemVerRange('1.0.0', '')).toThrow(InvalidConstraintError);
  });

  it('accepts partial version bounds (major-only, major.minor) as real package.json engines fields commonly use', () => {
    // e.g. a real "engines": { "node": ">=22" } — no patch, sometimes no minor, ever written.
    expect(satisfiesSemVerRange('22.5.0', '>=22')).toBe(true);
    expect(satisfiesSemVerRange('21.9.0', '>=22')).toBe(false);
    expect(satisfiesSemVerRange('18.2.1', '>=18.2')).toBe(true);
    expect(satisfiesSemVerRange('18.1.9', '>=18.2')).toBe(false);
  });

  it('still parses a fully-qualified prerelease bound correctly alongside partial-bound support', () => {
    expect(satisfiesSemVerRange('1.2.3-rc.2', '>=1.2.3-rc.1')).toBe(true);
  });
});

describe('semVerScheme', () => {
  it('round-trips parse -> compare consistently with compareSemVer', () => {
    const a = semVerScheme.parse('1.0.0');
    const b = semVerScheme.parse('1.1.0');
    expect(semVerScheme.compare(a, b)).toBe(-1);
  });

  it('refuses to compare across declared version schemes', () => {
    const semver = semVerScheme.parse('1.0.0');
    const foreign = { scheme: 'calver', raw: '2026.07' };
    expect(() => semVerScheme.compare(semver, foreign)).toThrow(IncompatibleVersionSchemeError);
  });

  it('refuses to check satisfaction for a version from a foreign scheme', () => {
    const foreign = { scheme: 'calver', raw: '2026.07' };
    expect(() => semVerScheme.satisfies(foreign, '>=1.0.0')).toThrow(IncompatibleVersionSchemeError);
  });

  it('is deterministic: parsing the same raw string twice yields equal results', () => {
    expect(semVerScheme.parse('3.4.5')).toEqual(semVerScheme.parse('3.4.5'));
  });
});
