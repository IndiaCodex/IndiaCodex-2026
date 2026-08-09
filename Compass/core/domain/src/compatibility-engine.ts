/**
 * Combines fired rules and the declared dependency constraint (if any) into
 * a single Compatibility status, following the fixed conflict-resolution
 * policy from docs/architecture/compatibility-engine.md#conflict-resolution-is-fixed-and-simple:
 * any "incompatible" wins outright; otherwise any "compatible" signal (or
 * "requires-constraint", treated as compatible-with-a-caveat — see the note
 * below) wins; otherwise the result is "unverified". The policy itself is
 * not configurable per rule pack.
 *
 * Two independent sources of signal are combined here (ADR 0011):
 * ecosystem-wide Compatibility Rules from a rule pack, and the specific
 * Dependency constraint a release itself declared (e.g. a package.json
 * version range). A rule pack encodes policy that applies across the
 * ecosystem ("the runtime must be at least vX"); a declared dependency
 * constraint is what one specific release actually asked for, and whether
 * the release being evaluated against it actually satisfies that ask is a
 * compatibility fact in its own right, independent of whether any rule
 * pack has an opinion about it.
 */
import { evaluateConstraint } from './constraint.js';
import { evaluateRules } from './rule-engine.js';
import type { Component } from './component.js';
import type { CompatibilityRule } from './compatibility-rule.js';
import type { CompatibilityStatus } from './compatibility-relationship.js';
import type { Dependency } from './dependency.js';
import type { Evidence } from './evidence.js';
import type { EvidenceId } from './ids.js';
import type { FiredRule } from './rule-engine.js';
import type { Release } from './release.js';
import type { VersionScheme } from './version.js';

export interface CompatibilityEvaluation {
  readonly status: CompatibilityStatus;
  readonly firedRules: readonly FiredRule[];
  /** Whether releaseB satisfies the declared Dependency constraint, or null if no Dependency was being evaluated. */
  readonly dependencySatisfied: boolean | null;
  readonly evidenceIds: readonly EvidenceId[];
}

export interface CompatibilityEvaluationInput {
  readonly releaseA: Release;
  readonly componentA: Component;
  readonly releaseB: Release;
  readonly componentB: Component;
  /** The specific declared Dependency from releaseA to componentB being evaluated, if this pair exists because of one. */
  readonly dependency: Dependency | null;
  readonly rules: readonly CompatibilityRule[];
  /** All Evidence available in the current snapshot; this function selects what's relevant to this pair. */
  readonly evidence: readonly Evidence[];
  readonly versionScheme: VersionScheme;
}

function isRelevantEvidence(evidence: Evidence, releaseA: Release, releaseB: Release, componentB: Component): boolean {
  if (evidence.subject.kind === 'release') {
    return evidence.subject.id === releaseA.id || evidence.subject.id === releaseB.id;
  }
  if (evidence.subject.kind === 'dependency') {
    return evidence.subject.releaseId === releaseA.id && evidence.subject.targetComponentId === componentB.id;
  }
  return false;
}

export function evaluateCompatibility(input: CompatibilityEvaluationInput): CompatibilityEvaluation {
  const firedRules = evaluateRules({
    releaseA: input.releaseA,
    componentA: input.componentA,
    releaseB: input.releaseB,
    componentB: input.componentB,
    rules: input.rules,
    versionScheme: input.versionScheme,
  });

  const dependencySatisfied = input.dependency
    ? evaluateConstraint(
        input.dependency.constraint,
        { version: input.releaseB.version, capabilities: input.releaseB.capabilities },
        input.versionScheme,
      )
    : null;

  const relevantEvidence = input.evidence.filter((item) =>
    isRelevantEvidence(item, input.releaseA, input.releaseB, input.componentB),
  );
  const evidenceIds = relevantEvidence.map((item) => item.id);

  const hasAnySignal = firedRules.length > 0 || dependencySatisfied !== null;
  if (!hasAnySignal || relevantEvidence.length === 0) {
    return { status: 'unverified', firedRules, dependencySatisfied, evidenceIds };
  }

  // "requires-constraint" rules fire precisely because their stated condition already held, so —
  // for this fixed status policy — they count as compatible, same as a satisfied dependency
  // constraint. Only an outright "incompatible" rule or an unsatisfied declared dependency wins.
  const hasIncompatible = firedRules.some((fired) => fired.rule.conclusion === 'incompatible') || dependencySatisfied === false;

  return { status: hasIncompatible ? 'incompatible' : 'compatible', firedRules, dependencySatisfied, evidenceIds };
}
