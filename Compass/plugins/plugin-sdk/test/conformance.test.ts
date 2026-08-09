import { describe, expect, it } from 'vitest';
import { toRulePackId, toSnapshotId, toTimestamp, versionRange } from '@compass/domain';
import { FakeCapabilityExtractor, FakeRulePack, FakeSourceAdapter, buildComponent, buildRelease, buildRepository } from '@compass/testing';
import {
  checkCapabilityExtractorConformance,
  checkRulePackConformance,
  checkRulesWellFormed,
  checkSourceAdapterConformance,
} from '../src/conformance.js';
import type { CompatibilityRule } from '@compass/domain';
import type { RulePackPort } from '../src/index.js';

const CONTEXT = { snapshotId: toSnapshotId('snap-1'), collectedAt: toTimestamp('2026-01-01T00:00:00.000Z') };

describe('checkSourceAdapterConformance', () => {
  it('reports no violations for a well-formed discovery result', async () => {
    const repository = buildRepository();
    const component = buildComponent({ repositoryId: repository.id });
    const release = buildRelease({ componentId: component.id });
    const adapter = new FakeSourceAdapter('good-adapter', (ctx) => ({
      repositories: [repository],
      components: [component],
      releases: [{ id: release.id, componentId: release.componentId, version: release.version, publishedAt: release.publishedAt, artifacts: [] }],
      evidence: [
        {
          id: 'e1' as never,
          subject: { kind: 'release', id: 'r1' as never },
          sourceType: 'declared-metadata',
          producedBy: 'good-adapter',
          payload: {},
          collectedAt: ctx.collectedAt,
          snapshotId: ctx.snapshotId,
        },
      ],
    }));

    const violations = await checkSourceAdapterConformance(adapter, CONTEXT);
    expect(violations).toEqual([]);
  });

  it('flags a component referencing an undiscovered repository', async () => {
    const component = buildComponent(); // its repositoryId was never included in `repositories`
    const adapter = new FakeSourceAdapter('bad-adapter', () => ({
      repositories: [],
      components: [component],
      releases: [],
      evidence: [],
    }));

    const violations = await checkSourceAdapterConformance(adapter, CONTEXT);
    expect(violations).toContainEqual(
      expect.objectContaining({ rule: 'component-must-reference-a-discovered-repository' }),
    );
  });

  it('flags a release referencing an undiscovered component', async () => {
    const release = buildRelease();
    const adapter = new FakeSourceAdapter('bad-adapter', () => ({
      repositories: [],
      components: [],
      releases: [{ id: release.id, componentId: release.componentId, version: release.version, publishedAt: release.publishedAt, artifacts: [] }],
      evidence: [],
    }));

    const violations = await checkSourceAdapterConformance(adapter, CONTEXT);
    expect(violations).toContainEqual(expect.objectContaining({ rule: 'release-must-reference-a-discovered-component' }));
  });

  it('flags evidence stamped with the wrong snapshotId', async () => {
    const adapter = new FakeSourceAdapter('bad-adapter', () => ({
      repositories: [],
      components: [],
      releases: [],
      evidence: [
        {
          id: 'e1' as never,
          subject: { kind: 'release', id: 'r1' as never },
          sourceType: 'declared-metadata',
          producedBy: 'bad-adapter',
          payload: {},
          collectedAt: CONTEXT.collectedAt,
          snapshotId: toSnapshotId('wrong-snapshot'),
        },
      ],
    }));

    const violations = await checkSourceAdapterConformance(adapter, CONTEXT);
    expect(violations).toContainEqual(
      expect.objectContaining({ rule: 'evidence-must-be-stamped-with-the-current-snapshot' }),
    );
  });
});

describe('checkCapabilityExtractorConformance', () => {
  const release = buildRelease();
  const discoveredRelease = {
    id: release.id,
    componentId: release.componentId,
    version: release.version,
    publishedAt: release.publishedAt,
    artifacts: [],
  };

  it('reports no violations for a well-formed extraction result', async () => {
    const extractor = new FakeCapabilityExtractor('good-extractor', (ctx) => new Map([
      [
        release.id,
        {
          releaseId: release.id,
          capabilities: [],
          dependencies: [],
          evidence: [
            {
              id: 'e1' as never,
              subject: { kind: 'release', id: release.id },
              sourceType: 'declared-metadata',
              producedBy: 'good-extractor',
              payload: {},
              collectedAt: ctx.collectedAt,
              snapshotId: ctx.snapshotId,
            },
          ],
        },
      ],
    ]));

    const violations = await checkCapabilityExtractorConformance(extractor, discoveredRelease, [], CONTEXT);
    expect(violations).toEqual([]);
  });

  it('flags a result referencing the wrong releaseId', async () => {
    const extractor = new FakeCapabilityExtractor('bad-extractor', () => new Map([
      [release.id, { releaseId: 'some-other-release' as never, capabilities: [], dependencies: [], evidence: [] }],
    ]));

    const violations = await checkCapabilityExtractorConformance(extractor, discoveredRelease, [], CONTEXT);
    expect(violations).toContainEqual(expect.objectContaining({ rule: 'result-must-reference-the-given-release' }));
  });

  it('flags evidence stamped with the wrong snapshotId', async () => {
    const extractor = new FakeCapabilityExtractor('bad-extractor', () => new Map([
      [
        release.id,
        {
          releaseId: release.id,
          capabilities: [],
          dependencies: [],
          evidence: [
            {
              id: 'e1' as never,
              subject: { kind: 'release', id: release.id },
              sourceType: 'declared-metadata',
              producedBy: 'bad-extractor',
              payload: {},
              collectedAt: CONTEXT.collectedAt,
              snapshotId: toSnapshotId('wrong-snapshot'),
            },
          ],
        },
      ],
    ]));

    const violations = await checkCapabilityExtractorConformance(extractor, discoveredRelease, [], CONTEXT);
    expect(violations).toContainEqual(
      expect.objectContaining({ rule: 'evidence-must-be-stamped-with-the-current-snapshot' }),
    );
  });
});

describe('checkRulePackConformance', () => {
  const packId = toRulePackId('pack-1');

  function rule(id: string, condition: CompatibilityRule['condition']): CompatibilityRule {
    return {
      id: id as never,
      description: 'test rule',
      appliesTo: { componentTypeA: null, componentTypeB: null },
      condition,
      conclusion: 'compatible',
      rulePackId: packId,
    };
  }

  it('reports no violations for a well-formed rule pack', () => {
    const pack = new FakeRulePack(packId, 'good-pack', [rule('r1', versionRange('>=1.0.0'))]);
    expect(checkRulePackConformance(pack)).toEqual([]);
  });

  it('flags a rule pack whose rules() is not deterministic across calls', () => {
    let callCount = 0;
    const pack: RulePackPort = {
      id: packId,
      name: 'flaky-pack',
      rules: () => {
        callCount += 1;
        return [rule(`r${callCount}`, versionRange('>=1.0.0'))];
      },
    };
    expect(checkRulePackConformance(pack)).toContainEqual(expect.objectContaining({ rule: 'rules-must-be-deterministic' }));
  });

  it('flags duplicate rule ids within a pack', () => {
    const pack = new FakeRulePack(packId, 'dup-pack', [
      rule('r1', versionRange('>=1.0.0')),
      rule('r1', versionRange('>=2.0.0')),
    ]);
    expect(checkRulePackConformance(pack)).toContainEqual(
      expect.objectContaining({ rule: 'rule-ids-must-be-unique-within-a-pack' }),
    );
  });

  it('flags a rule whose rulePackId does not match the pack returning it', () => {
    const mismatchedRule = { ...rule('r1', versionRange('>=1.0.0')), rulePackId: toRulePackId('other-pack') };
    const pack = new FakeRulePack(packId, 'mismatch-pack', [mismatchedRule]);
    expect(checkRulePackConformance(pack)).toContainEqual(
      expect.objectContaining({ rule: 'rule-must-declare-its-owning-rule-pack' }),
    );
  });

  it('flags an empty version-range constraint', () => {
    const pack = new FakeRulePack(packId, 'bad-pack', [rule('r1', versionRange(''))]);
    expect(checkRulePackConformance(pack)).toContainEqual(expect.objectContaining({ rule: 'constraint-must-not-be-empty' }));
  });

  it('flags an empty capability name', () => {
    const pack = new FakeRulePack(packId, 'bad-pack', [rule('r1', { kind: 'capability', name: '', range: null })]);
    expect(checkRulePackConformance(pack)).toContainEqual(expect.objectContaining({ rule: 'constraint-must-not-be-empty' }));
  });

  it('accepts a well-formed capability constraint', () => {
    const pack = new FakeRulePack(packId, 'good-pack', [rule('r1', { kind: 'capability', name: 'zk-proof-v2', range: null })]);
    expect(checkRulePackConformance(pack)).toEqual([]);
  });

  it('flags an empty "and"/"or" composite constraint', () => {
    const pack = new FakeRulePack(packId, 'bad-pack', [rule('r1', { kind: 'and', constraints: [] })]);
    expect(checkRulePackConformance(pack)).toContainEqual(
      expect.objectContaining({ rule: 'composite-constraint-must-not-be-empty' }),
    );
  });

  it('recurses into "not" and nested composite constraints', () => {
    const pack = new FakeRulePack(packId, 'bad-pack', [
      rule('r1', { kind: 'not', constraint: { kind: 'and', constraints: [] } }),
    ]);
    expect(checkRulePackConformance(pack)).toContainEqual(
      expect.objectContaining({ rule: 'composite-constraint-must-not-be-empty' }),
    );
  });

  it('accepts a well-formed nested composite constraint', () => {
    const pack = new FakeRulePack(packId, 'good-pack', [
      rule('r1', { kind: 'and', constraints: [versionRange('>=1.0.0'), { kind: 'not', constraint: versionRange('<0.5.0') }] }),
    ]);
    expect(checkRulePackConformance(pack)).toEqual([]);
  });
});

describe('checkRulesWellFormed', () => {
  it('works directly on a plain rule array, without a RulePackPort wrapper', () => {
    const rules: CompatibilityRule[] = [
      {
        id: 'r1' as never,
        description: 'test',
        appliesTo: { componentTypeA: null, componentTypeB: null },
        condition: versionRange(''),
        conclusion: 'compatible',
        rulePackId: 'pack-1' as never,
      },
    ];
    expect(checkRulesWellFormed(rules)).toContainEqual(expect.objectContaining({ rule: 'constraint-must-not-be-empty' }));
  });
});
