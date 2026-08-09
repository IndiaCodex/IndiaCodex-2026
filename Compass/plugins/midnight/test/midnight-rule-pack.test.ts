import { describe, expect, it } from 'vitest';
import { evaluateConstraint, semVerScheme } from '@compass/domain';
import { checkRulePackConformance } from '@compass/plugin-sdk';
import { MidnightRulePack } from '../src/midnight-rule-pack.js';
import type { CompatibilityRule } from '@compass/domain';

function mustFindRule(id: string): CompatibilityRule {
  const rule = new MidnightRulePack().rules().find((candidate) => candidate.id === id);
  if (!rule) throw new Error(`No rule found with id "${id}"`);
  return rule;
}

describe('MidnightRulePack', () => {
  it('passes the shared RulePackPort conformance suite', () => {
    const violations = checkRulePackConformance(new MidnightRulePack());
    expect(violations).toEqual([]);
  });

  it('exposes exactly the prerelease-advisory and stable-release rules', () => {
    const rules = new MidnightRulePack().rules();
    expect(rules.map((rule) => rule.id).sort()).toEqual(['midnight-prerelease-advisory', 'midnight-stable-release'].sort());
  });

  it('the prerelease-advisory rule fires (as "requires-constraint") for a release carrying the prerelease capability', () => {
    const rule = mustFindRule('midnight-prerelease-advisory');
    const subject = {
      version: semVerScheme.parse('5.0.0-beta.6'),
      capabilities: [{ name: 'prerelease', version: semVerScheme.parse('5.0.0-beta.6'), direction: 'provided' as const }],
    };
    expect(evaluateConstraint(rule.condition, subject, semVerScheme)).toBe(true);
    expect(rule.conclusion).toBe('requires-constraint');
  });

  it('the prerelease-advisory rule does not fire for a release with no prerelease capability', () => {
    const rule = mustFindRule('midnight-prerelease-advisory');
    const subject = { version: semVerScheme.parse('5.0.0'), capabilities: [] };
    expect(evaluateConstraint(rule.condition, subject, semVerScheme)).toBe(false);
  });

  it('the stable-release rule fires (as "compatible") for a release with no prerelease capability', () => {
    const rule = mustFindRule('midnight-stable-release');
    const subject = { version: semVerScheme.parse('5.0.0'), capabilities: [] };
    expect(evaluateConstraint(rule.condition, subject, semVerScheme)).toBe(true);
    expect(rule.conclusion).toBe('compatible');
  });

  it('the stable-release rule does not fire for a prerelease', () => {
    const rule = mustFindRule('midnight-stable-release');
    const subject = {
      version: semVerScheme.parse('5.0.0-beta.6'),
      capabilities: [{ name: 'prerelease', version: semVerScheme.parse('5.0.0-beta.6'), direction: 'provided' as const }],
    };
    expect(evaluateConstraint(rule.condition, subject, semVerScheme)).toBe(false);
  });

  it('rules() is pure and deterministic across calls', () => {
    const pack = new MidnightRulePack();
    expect(pack.rules()).toEqual(pack.rules());
  });
});
