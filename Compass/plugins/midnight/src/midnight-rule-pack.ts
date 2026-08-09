/**
 * The Midnight ecosystem's declarative Compatibility Rules
 * (docs/architecture/plugin-architecture.md#rule-pack).
 *
 * Deliberately small. Most of the compatibility categories this
 * integration answers — SDK version compatibility, runtime/minimum-version
 * checks, missing required capabilities — are already handled generically
 * by ADR 0011 (a release's own declared Dependency constraint is evaluated
 * automatically) and by the Constraint model itself (a capability that
 * isn't provided at all simply fails to satisfy a `requiresCapability`
 * constraint, no extra rule needed). A rule pack exists for genuine
 * ecosystem-wide *policy* that isn't already a specific declared
 * constraint — see docs/midnight-plugin.md#rule-pack for the full mapping
 * from every requested rule category to the mechanism that actually
 * answers it.
 */
import { not, requiresCapability, toCompatibilityRuleId, toRulePackId } from '@compass/domain';
import type { CompatibilityRule, RulePackId } from '@compass/domain';
import type { RulePackPort } from '@compass/plugin-sdk';

export const MIDNIGHT_RULE_PACK_ID: RulePackId = toRulePackId('midnight-ecosystem-rules');

/**
 * Flags a dependency on a prerelease (alpha/beta/rc) version of anything as
 * worth a second look — not an outright incompatibility (prereleases are
 * often used deliberately), hence `requires-constraint` rather than
 * `incompatible`. Fires whenever the CapabilityExtractors' `prerelease`
 * marker (docs/midnight-plugin.md#capability-extraction) is present on the
 * dependency's target release.
 */
const PRERELEASE_ADVISORY_RULE: CompatibilityRule = {
  id: toCompatibilityRuleId('midnight-prerelease-advisory'),
  description: 'Flags a dependency on a prerelease (alpha/beta/rc) version as worth investigating before relying on it.',
  appliesTo: { componentTypeA: null, componentTypeB: null },
  condition: requiresCapability('prerelease'),
  conclusion: 'requires-constraint',
  rulePackId: MIDNIGHT_RULE_PACK_ID,
};

/**
 * The mirror image of the advisory above: a dependency on a release with
 * no prerelease marker at all is a plain, unremarkable "compatible" —
 * every declared dependency also gets ADR 0011's own constraint check, but
 * this rule is what lets a pair with *no* declared Dependency (e.g. an
 * Upgrade Advisor query comparing arbitrary releases) still get a
 * `compatible` signal instead of defaulting to `unverified` when nothing
 * else applies.
 */
const STABLE_RELEASE_RULE: CompatibilityRule = {
  id: toCompatibilityRuleId('midnight-stable-release'),
  description: 'A release with no prerelease marker is, on its own, an unremarkable compatible baseline.',
  appliesTo: { componentTypeA: null, componentTypeB: null },
  condition: not(requiresCapability('prerelease')),
  conclusion: 'compatible',
  rulePackId: MIDNIGHT_RULE_PACK_ID,
};

export class MidnightRulePack implements RulePackPort {
  public readonly id = MIDNIGHT_RULE_PACK_ID;
  public readonly name = 'midnight-ecosystem-rules';

  public rules(): readonly CompatibilityRule[] {
    return [PRERELEASE_ADVISORY_RULE, STABLE_RELEASE_RULE];
  }
}
