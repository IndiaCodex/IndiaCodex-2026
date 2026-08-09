import type { CompatibilityRule, RulePackId } from '@compass/domain';

/**
 * Supplies an ecosystem's own declarative Compatibility Rules
 * (docs/architecture/plugin-architecture.md#rule-pack). `rules()` is
 * synchronous and pure by contract — a rule pack is data, not a network
 * call (ADR 0005).
 */
export interface RulePackPort {
  readonly id: RulePackId;
  readonly name: string;
  rules(): readonly CompatibilityRule[];
}
