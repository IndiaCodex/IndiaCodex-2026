/**
 * Evaluates declarative Compatibility Rules against a pair of releases.
 * Deterministic and order-independent by construction (ADR 0005, ADR 0002):
 * each rule is evaluated in isolation against the same input, and a rule
 * only appears in the result when it actually fires — an unmatched rule
 * contributes nothing, rather than an implicit opposite conclusion.
 */
import { evaluateConstraint } from './constraint.js';
import type { Component } from './component.js';
import type { CompatibilityRule, CompatibilityRuleScope } from './compatibility-rule.js';
import type { Release } from './release.js';
import type { VersionScheme } from './version.js';

export interface FiredRule {
  readonly rule: CompatibilityRule;
}

export interface RuleEvaluationInput {
  readonly releaseA: Release;
  readonly componentA: Component;
  readonly releaseB: Release;
  readonly componentB: Component;
  readonly rules: readonly CompatibilityRule[];
  readonly versionScheme: VersionScheme;
}

function scopeMatches(scope: CompatibilityRuleScope, componentA: Component, componentB: Component): boolean {
  if (scope.componentTypeA !== null && scope.componentTypeA !== componentA.type) return false;
  if (scope.componentTypeB !== null && scope.componentTypeB !== componentB.type) return false;
  return true;
}

/**
 * Returns every rule that both structurally applies to this pair (by
 * component type) and whose condition is satisfied by releaseB — the "B"
 * side of the pair is always the subject a rule's condition is checked
 * against (e.g. "does the runtime release satisfy >=2.0.0").
 */
export function evaluateRules(input: RuleEvaluationInput): readonly FiredRule[] {
  const subject = { version: input.releaseB.version, capabilities: input.releaseB.capabilities };
  return input.rules
    .filter((rule) => scopeMatches(rule.appliesTo, input.componentA, input.componentB))
    .filter((rule) => evaluateConstraint(rule.condition, subject, input.versionScheme))
    .map((rule) => ({ rule }));
}
