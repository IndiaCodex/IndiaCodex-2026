import { describe, expect, it } from 'vitest';
import { and, evaluateConstraint, not, or, requiresCapability, versionRange } from '../src/constraint.js';
import { semVerScheme } from '../src/version.js';
import type { ConstraintSubject } from '../src/constraint.js';

const subjectWithVersion = (raw: string): ConstraintSubject => ({
  version: semVerScheme.parse(raw),
  capabilities: [],
});

const subjectWithCapabilities = (names: readonly string[]): ConstraintSubject => ({
  version: semVerScheme.parse('1.0.0'),
  capabilities: names.map((name) => ({ name, version: semVerScheme.parse('1.0.0'), direction: 'provided' as const })),
});

describe('evaluateConstraint: version-range', () => {
  it('delegates to the version scheme', () => {
    expect(evaluateConstraint(versionRange('>=2.0.0'), subjectWithVersion('2.5.0'), semVerScheme)).toBe(true);
    expect(evaluateConstraint(versionRange('>=2.0.0'), subjectWithVersion('1.5.0'), semVerScheme)).toBe(false);
  });
});

describe('evaluateConstraint: capability', () => {
  it('is satisfied when the named capability is provided, with no range', () => {
    expect(evaluateConstraint(requiresCapability('zk-proof-v2'), subjectWithCapabilities(['zk-proof-v2']), semVerScheme)).toBe(
      true,
    );
  });

  it('is not satisfied when the capability is absent', () => {
    expect(evaluateConstraint(requiresCapability('zk-proof-v2'), subjectWithCapabilities(['other']), semVerScheme)).toBe(false);
  });

  it('ignores a capability declared with direction "required" (only "provided" satisfies)', () => {
    const subject: ConstraintSubject = {
      version: semVerScheme.parse('1.0.0'),
      capabilities: [{ name: 'zk-proof-v2', version: semVerScheme.parse('1.0.0'), direction: 'required' }],
    };
    expect(evaluateConstraint(requiresCapability('zk-proof-v2'), subject, semVerScheme)).toBe(false);
  });

  it('checks the capability version against a range when one is given', () => {
    const subject: ConstraintSubject = {
      version: semVerScheme.parse('1.0.0'),
      capabilities: [{ name: 'zk-proof', version: semVerScheme.parse('2.5.0'), direction: 'provided' }],
    };
    expect(evaluateConstraint(requiresCapability('zk-proof', '>=2.0.0'), subject, semVerScheme)).toBe(true);
    expect(evaluateConstraint(requiresCapability('zk-proof', '>=3.0.0'), subject, semVerScheme)).toBe(false);
  });
});

describe('evaluateConstraint: composite', () => {
  it('and() requires every child constraint to hold', () => {
    const constraint = and(versionRange('>=1.0.0'), requiresCapability('zk-proof-v2'));
    expect(evaluateConstraint(constraint, { version: semVerScheme.parse('1.5.0'), capabilities: subjectWithCapabilities(['zk-proof-v2']).capabilities }, semVerScheme)).toBe(true);
    expect(evaluateConstraint(constraint, subjectWithVersion('1.5.0'), semVerScheme)).toBe(false);
  });

  it('or() requires at least one child constraint to hold', () => {
    const constraint = or(versionRange('>=5.0.0'), requiresCapability('zk-proof-v2'));
    expect(evaluateConstraint(constraint, subjectWithCapabilities(['zk-proof-v2']), semVerScheme)).toBe(true);
    expect(evaluateConstraint(constraint, subjectWithVersion('1.0.0'), semVerScheme)).toBe(false);
  });

  it('not() inverts its child constraint', () => {
    const constraint = not(versionRange('>=2.0.0'));
    expect(evaluateConstraint(constraint, subjectWithVersion('1.0.0'), semVerScheme)).toBe(true);
    expect(evaluateConstraint(constraint, subjectWithVersion('2.0.0'), semVerScheme)).toBe(false);
  });

  it('composes arbitrarily deeply', () => {
    const constraint = and(or(versionRange('>=1.0.0'), versionRange('<0.5.0')), not(requiresCapability('deprecated')));
    expect(evaluateConstraint(constraint, subjectWithVersion('1.2.0'), semVerScheme)).toBe(true);
    expect(
      evaluateConstraint(
        constraint,
        { version: semVerScheme.parse('1.2.0'), capabilities: subjectWithCapabilities(['deprecated']).capabilities },
        semVerScheme,
      ),
    ).toBe(false);
  });
});
