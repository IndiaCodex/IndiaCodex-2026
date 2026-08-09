import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { versionRange } from '../src/constraint.js';
import { evaluateRules } from '../src/rule-engine.js';
import { semVerScheme } from '../src/version.js';
import { toCompatibilityRuleId, toRulePackId } from '../src/ids.js';
import { component, release } from './fixtures.js';
import type { CompatibilityRule } from '../src/compatibility-rule.js';

const RULE_PACK = toRulePackId('pack-1');

function rule(input: {
  id: string;
  range: string;
  conclusion: CompatibilityRule['conclusion'];
  componentTypeA?: CompatibilityRule['appliesTo']['componentTypeA'];
  componentTypeB?: CompatibilityRule['appliesTo']['componentTypeB'];
}): CompatibilityRule {
  return {
    id: toCompatibilityRuleId(input.id),
    description: `test rule ${input.id}`,
    appliesTo: { componentTypeA: input.componentTypeA ?? null, componentTypeB: input.componentTypeB ?? null },
    condition: versionRange(input.range),
    conclusion: input.conclusion,
    rulePackId: RULE_PACK,
  };
}

describe('evaluateRules', () => {
  const sdk = component('sdk-a', 'sdk');
  const runtime = component('runtime-a', 'runtime');
  const sdkRelease = release({ id: 'sdk-1.0', componentId: 'sdk-a', version: '1.0.0' });

  it('fires a rule whose condition the B-side release satisfies', () => {
    const runtimeRelease = release({ id: 'runtime-2.0', componentId: 'runtime-a', version: '2.0.0' });
    const rules = [rule({ id: 'r1', range: '>=2.0.0', conclusion: 'compatible' })];

    const fired = evaluateRules({
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      rules,
      versionScheme: semVerScheme,
    });

    expect(fired).toHaveLength(1);
    expect(fired[0]?.rule.id).toBe('r1');
  });

  it('does not fire a rule whose condition the B-side release does not satisfy', () => {
    const runtimeRelease = release({ id: 'runtime-1.0', componentId: 'runtime-a', version: '1.0.0' });
    const rules = [rule({ id: 'r1', range: '>=2.0.0', conclusion: 'compatible' })];

    const fired = evaluateRules({
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      rules,
      versionScheme: semVerScheme,
    });

    expect(fired).toEqual([]);
  });

  it('respects appliesTo component-type scoping on the B side', () => {
    const runtimeRelease = release({ id: 'runtime-2.0', componentId: 'runtime-a', version: '2.0.0' });
    const rules = [rule({ id: 'r1', range: '>=2.0.0', conclusion: 'compatible', componentTypeB: 'toolchain' })];

    const fired = evaluateRules({
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime, // type is 'runtime', not 'toolchain'
      rules,
      versionScheme: semVerScheme,
    });

    expect(fired).toEqual([]);
  });

  it('respects appliesTo component-type scoping on the A side', () => {
    const runtimeRelease = release({ id: 'runtime-2.0', componentId: 'runtime-a', version: '2.0.0' });
    const rules = [rule({ id: 'r1', range: '>=2.0.0', conclusion: 'compatible', componentTypeA: 'application' })];

    const fired = evaluateRules({
      releaseA: sdkRelease,
      componentA: sdk, // type is 'sdk', not 'application'
      releaseB: runtimeRelease,
      componentB: runtime,
      rules,
      versionScheme: semVerScheme,
    });

    expect(fired).toEqual([]);
  });

  it('evaluates every applicable rule independently — multiple rules can fire at once', () => {
    const runtimeRelease = release({ id: 'runtime-2.0', componentId: 'runtime-a', version: '2.0.0' });
    const rules = [
      rule({ id: 'r1', range: '>=1.0.0', conclusion: 'compatible' }),
      rule({ id: 'r2', range: '>=2.0.0', conclusion: 'compatible' }),
    ];

    const fired = evaluateRules({
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      rules,
      versionScheme: semVerScheme,
    });

    expect(fired.map((f) => f.rule.id).sort()).toEqual(['r1', 'r2']);
  });

  it('is order-independent: shuffling the input rule list never changes the set of fired rule ids', () => {
    const runtimeRelease = release({ id: 'runtime-2.0', componentId: 'runtime-a', version: '2.0.0' });
    const rules = [
      rule({ id: 'r1', range: '>=1.0.0', conclusion: 'compatible' }),
      rule({ id: 'r2', range: '>=5.0.0', conclusion: 'incompatible' }),
      rule({ id: 'r3', range: '>=2.0.0', conclusion: 'compatible' }),
    ];

    fc.assert(
      fc.property(fc.shuffledSubarray(rules, { minLength: rules.length }), (shuffled) => {
        const fired = evaluateRules({
          releaseA: sdkRelease,
          componentA: sdk,
          releaseB: runtimeRelease,
          componentB: runtime,
          rules: shuffled,
          versionScheme: semVerScheme,
        });
        expect(fired.map((f) => f.rule.id).sort()).toEqual(['r1', 'r3']);
      }),
    );
  });

  it('is deterministic: evaluating the same input twice yields identical results', () => {
    const runtimeRelease = release({ id: 'runtime-2.0', componentId: 'runtime-a', version: '2.0.0' });
    const rules = [rule({ id: 'r1', range: '>=1.0.0', conclusion: 'compatible' })];
    const input = {
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      rules,
      versionScheme: semVerScheme,
    };

    expect(evaluateRules(input)).toEqual(evaluateRules(input));
  });
});
