import type { Constraint } from './constraint.js';
import type { ComponentType } from './component.js';
import type { CompatibilityRuleId, RulePackId } from './ids.js';

/** What a rule concludes when its condition is satisfied. */
export type RuleConclusionType = 'compatible' | 'incompatible' | 'requires-constraint';

/**
 * Which pairs of component types a rule is relevant to. `null` means "any
 * type" for that side. This is a structural filter, evaluated before a
 * rule's condition is ever evaluated — see rule-engine.ts.
 */
export interface CompatibilityRuleScope {
  readonly componentTypeA: ComponentType | null;
  readonly componentTypeB: ComponentType | null;
}

/**
 * A declarative statement, supplied by an ecosystem's rule pack, that
 * evaluates a condition against a release (the "B" side of a pair) and
 * produces a conclusion. Rules never execute code — see ADR 0005.
 */
export interface CompatibilityRule {
  readonly id: CompatibilityRuleId;
  readonly description: string;
  readonly appliesTo: CompatibilityRuleScope;
  readonly condition: Constraint;
  readonly conclusion: RuleConclusionType;
  readonly rulePackId: RulePackId;
}
