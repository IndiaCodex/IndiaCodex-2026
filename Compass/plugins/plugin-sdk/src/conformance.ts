/**
 * Structural conformance checks every plugin must pass
 * (docs/architecture/plugin-architecture.md#conformance-not-trust-by-convention).
 * These are plain assertion functions, not a test framework of their own —
 * a plugin author calls them from their own test suite, in their own test
 * runner, and asserts the returned violation list is empty. Deliberately
 * not bundled as vitest `describe`/`it` blocks: a plugin author shouldn't
 * have to adopt this repository's test runner just to conform to its contract.
 */
import type { Artifact, CompatibilityRule, Constraint } from '@compass/domain';
import type {
  CapabilityExtractorPort,
  DiscoveredRelease,
  IngestionContext,
  RulePackPort,
  SourceAdapterPort,
} from '@compass/application';

export interface ConformanceViolation {
  readonly rule: string;
  readonly message: string;
}

export async function checkSourceAdapterConformance(
  adapter: SourceAdapterPort,
  context: IngestionContext,
): Promise<readonly ConformanceViolation[]> {
  const violations: ConformanceViolation[] = [];
  const result = await adapter.discover(context);

  const repositoryIds = new Set(result.repositories.map((repository) => repository.id));
  for (const component of result.components) {
    if (!repositoryIds.has(component.repositoryId)) {
      violations.push({
        rule: 'component-must-reference-a-discovered-repository',
        message: `Component "${component.id}" references repository "${component.repositoryId}", which "${adapter.name}" did not include in its discovered repositories.`,
      });
    }
  }

  const componentIds = new Set(result.components.map((component) => component.id));
  for (const release of result.releases) {
    if (!componentIds.has(release.componentId)) {
      violations.push({
        rule: 'release-must-reference-a-discovered-component',
        message: `Release "${release.id}" references component "${release.componentId}", which "${adapter.name}" did not include in its discovered components.`,
      });
    }
  }

  for (const evidence of result.evidence) {
    if (evidence.snapshotId !== context.snapshotId) {
      violations.push({
        rule: 'evidence-must-be-stamped-with-the-current-snapshot',
        message: `Evidence "${evidence.id}" is stamped with snapshotId "${evidence.snapshotId}", but the supplied IngestionContext is for "${context.snapshotId}".`,
      });
    }
  }

  return violations;
}

export async function checkCapabilityExtractorConformance(
  extractor: CapabilityExtractorPort,
  release: DiscoveredRelease,
  artifacts: readonly Artifact[],
  context: IngestionContext,
): Promise<readonly ConformanceViolation[]> {
  const violations: ConformanceViolation[] = [];
  const result = await extractor.extract(release, artifacts, context);

  if (result.releaseId !== release.id) {
    violations.push({
      rule: 'result-must-reference-the-given-release',
      message: `"${extractor.name}" returned a result for releaseId "${result.releaseId}" when asked to extract release "${release.id}".`,
    });
  }

  for (const evidence of result.evidence) {
    if (evidence.snapshotId !== context.snapshotId) {
      violations.push({
        rule: 'evidence-must-be-stamped-with-the-current-snapshot',
        message: `Evidence "${evidence.id}" is stamped with snapshotId "${evidence.snapshotId}", but the supplied IngestionContext is for "${context.snapshotId}".`,
      });
    }
  }

  return violations;
}

export function checkRulePackConformance(pack: RulePackPort): readonly ConformanceViolation[] {
  const violations: ConformanceViolation[] = [];

  const first = pack.rules();
  const second = pack.rules();
  if (JSON.stringify(first) !== JSON.stringify(second)) {
    violations.push({
      rule: 'rules-must-be-deterministic',
      message: `RulePack "${pack.id}" returned different rules across two consecutive calls to rules() — a rule pack must be pure and deterministic (ADR 0005).`,
    });
  }

  const seenIds = new Set<string>();
  for (const rule of first) {
    if (seenIds.has(rule.id)) {
      violations.push({
        rule: 'rule-ids-must-be-unique-within-a-pack',
        message: `RulePack "${pack.id}" declares more than one rule with id "${rule.id}".`,
      });
    }
    seenIds.add(rule.id);

    if (rule.rulePackId !== pack.id) {
      violations.push({
        rule: 'rule-must-declare-its-owning-rule-pack',
        message: `Rule "${rule.id}" declares rulePackId "${rule.rulePackId}", but was returned by RulePack "${pack.id}".`,
      });
    }

    violations.push(...checkConstraintWellFormed(rule.condition, rule.id));
  }

  return violations;
}

function checkConstraintWellFormed(constraint: Constraint, ruleId: string): ConformanceViolation[] {
  switch (constraint.kind) {
    case 'version-range':
      return constraint.range.trim() === ''
        ? [{ rule: 'constraint-must-not-be-empty', message: `Rule "${ruleId}" has a version-range constraint with an empty range.` }]
        : [];
    case 'capability':
      return constraint.name.trim() === ''
        ? [{ rule: 'constraint-must-not-be-empty', message: `Rule "${ruleId}" has a capability constraint with an empty name.` }]
        : [];
    case 'and':
    case 'or':
      return constraint.constraints.length === 0
        ? [{ rule: 'composite-constraint-must-not-be-empty', message: `Rule "${ruleId}" has an empty "${constraint.kind}" constraint.` }]
        : constraint.constraints.flatMap((child) => checkConstraintWellFormed(child, ruleId));
    case 'not':
      return checkConstraintWellFormed(constraint.constraint, ruleId);
  }
}

/** Re-exported for plugin authors who want to sanity-check a rule list outside of a full RulePackPort. */
export function checkRulesWellFormed(rules: readonly CompatibilityRule[]): readonly ConformanceViolation[] {
  return rules.flatMap((rule) => checkConstraintWellFormed(rule.condition, rule.id));
}
