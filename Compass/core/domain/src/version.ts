import { InvalidConstraintError, InvalidVersionError, IncompatibleVersionSchemeError } from './errors.js';

/**
 * A version identifier under some pluggable scheme. Most ecosystems use
 * semantic versioning (see `semVerScheme` below), but the core does not
 * assume it — a plugin ecosystem whose artifacts version differently
 * supplies its own `VersionScheme` (docs/architecture/domain-model.md#value-objects).
 */
export interface Version {
  readonly scheme: string;
  readonly raw: string;
}

export interface VersionScheme {
  readonly name: string;
  parse(raw: string): Version;
  compare(a: Version, b: Version): -1 | 0 | 1;
  satisfies(version: Version, range: string): boolean;
}

function assertSameScheme(a: Version, b: Version): void {
  if (a.scheme !== b.scheme) {
    throw new IncompatibleVersionSchemeError(a.scheme, b.scheme);
  }
}

// --- Dependency-free semantic version parsing & comparison -----------------

export interface ParsedSemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: readonly (string | number)[];
}

const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?(?:\+[0-9A-Za-z-.]+)?$/;

export function parseSemVer(raw: string): ParsedSemVer {
  const match = SEMVER_PATTERN.exec(raw.trim());
  if (!match) {
    throw new InvalidVersionError(raw, 'semver');
  }
  const [, majorStr, minorStr, patchStr, prereleaseStr] = match;
  const prerelease: (string | number)[] = prereleaseStr
    ? prereleaseStr.split('.').map((part) => (/^\d+$/.test(part) ? Number(part) : part))
    : [];
  return {
    major: Number(majorStr),
    minor: Number(minorStr),
    patch: Number(patchStr),
    prerelease,
  };
}

export function compareSemVer(a: ParsedSemVer, b: ParsedSemVer): -1 | 0 | 1 {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;

  // A version with no prerelease outranks one with a prerelease at the same major.minor.patch.
  if (a.prerelease.length === 0 && b.prerelease.length > 0) return 1;
  if (a.prerelease.length > 0 && b.prerelease.length === 0) return -1;

  const length = Math.max(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const partA = a.prerelease[index];
    const partB = b.prerelease[index];
    if (partA === undefined) return -1;
    if (partB === undefined) return 1;
    if (partA === partB) continue;
    if (typeof partA === 'number' && typeof partB === 'number') return partA < partB ? -1 : 1;
    return String(partA) < String(partB) ? -1 : 1;
  }
  return 0;
}

type RangeOperator = '=' | '>' | '>=' | '<' | '<=' | '^' | '~';

interface RangeClause {
  readonly operator: RangeOperator;
  readonly version: ParsedSemVer;
}

// Longest-prefix-first, so '>=' is tried before '>' and never shadowed by it.
const RANGE_OPERATORS: readonly RangeOperator[] = ['>=', '<=', '^', '~', '>', '<', '='];

// Real range bounds are very commonly partial — e.g. a package.json `"engines": { "node": ">=22" }`
// means major version 22 and up, not literally "22.0.0" written out. Missing minor/patch are
// zero-filled for range bounds specifically; a Release's own exact version (parseSemVer, above)
// stays strict, since a release genuinely having only a partial version would be a real anomaly.
const PARTIAL_VERSION_PATTERN = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/;

function parseRangeBound(raw: string): ParsedSemVer {
  const match = PARTIAL_VERSION_PATTERN.exec(raw);
  if (!match) {
    return parseSemVer(raw); // falls back to strict parsing for a fully-qualified bound like "1.2.3-rc.1"
  }
  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor ?? 0), patch: Number(patch ?? 0), prerelease: [] };
}

function parseRangeClause(token: string): RangeClause {
  const operator = RANGE_OPERATORS.find((candidate) => token.startsWith(candidate));
  const versionStr = operator ? token.slice(operator.length) : token;
  return { operator: operator ?? '=', version: parseRangeBound(versionStr) };
}

function parseSemVerRange(range: string): readonly RangeClause[] {
  const tokens = range.trim().split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0) {
    throw new InvalidConstraintError(range, 'a version range must contain at least one clause.');
  }
  return tokens.map(parseRangeClause);
}

function satisfiesClause(version: ParsedSemVer, clause: RangeClause): boolean {
  const comparison = compareSemVer(version, clause.version);
  switch (clause.operator) {
    case '=':
      return comparison === 0;
    case '>':
      return comparison > 0;
    case '>=':
      return comparison >= 0;
    case '<':
      return comparison < 0;
    case '<=':
      return comparison <= 0;
    case '^':
      if (comparison < 0) return false;
      if (clause.version.major > 0) return version.major === clause.version.major;
      if (clause.version.minor > 0) return version.major === 0 && version.minor === clause.version.minor;
      return version.major === 0 && version.minor === 0 && version.patch === clause.version.patch;
    case '~':
      if (comparison < 0) return false;
      return version.major === clause.version.major && version.minor === clause.version.minor;
  }
}

/** A version satisfies a range when it satisfies every space-separated clause in it (logical AND). */
export function satisfiesSemVerRange(raw: string, range: string): boolean {
  const version = parseSemVer(raw);
  const clauses = parseSemVerRange(range);
  return clauses.every((clause) => satisfiesClause(version, clause));
}

// --- The default, provided VersionScheme ------------------------------------

export const semVerScheme: VersionScheme = {
  name: 'semver',
  parse(raw: string): Version {
    parseSemVer(raw); // throws InvalidVersionError if malformed
    return { scheme: 'semver', raw };
  },
  compare(a: Version, b: Version): -1 | 0 | 1 {
    assertSameScheme(a, b);
    return compareSemVer(parseSemVer(a.raw), parseSemVer(b.raw));
  },
  satisfies(version: Version, range: string): boolean {
    if (version.scheme !== 'semver') {
      throw new IncompatibleVersionSchemeError(version.scheme, 'semver');
    }
    return satisfiesSemVerRange(version.raw, range);
  },
};
