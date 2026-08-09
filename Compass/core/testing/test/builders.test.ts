import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildArtifact,
  buildBreakingChange,
  buildCapability,
  buildCompatibilityRelationship,
  buildCompatibilityRule,
  buildComponent,
  buildDependency,
  buildEvidence,
  buildRecommendation,
  buildRelease,
  buildRepository,
  buildRisk,
  buildSnapshot,
  resetTestSequence,
} from '../src/index.js';

beforeEach(() => {
  resetTestSequence();
});

describe('builders', () => {
  it('buildRepository produces a valid Repository with unique defaults across calls', () => {
    const a = buildRepository();
    const b = buildRepository();
    expect(a.id).not.toBe(b.id);
    expect(a.hostingPlatform).toBe('github');
  });

  it('every builder respects overrides', () => {
    const repo = buildRepository({ hostingPlatform: 'gitlab' });
    expect(repo.hostingPlatform).toBe('gitlab');

    const component = buildComponent({ type: 'runtime' });
    expect(component.type).toBe('runtime');

    const artifact = buildArtifact({ type: 'binary' });
    expect(artifact.type).toBe('binary');
  });

  it('buildCapability defaults to a "provided" capability', () => {
    const capability = buildCapability();
    expect(capability.direction).toBe('provided');
  });

  it('buildDependency defaults to a "required" dependency with a satisfiable-looking range', () => {
    const dependency = buildDependency();
    expect(dependency.kind).toBe('required');
    expect(dependency.constraint).toEqual({ kind: 'version-range', range: '>=1.0.0' });
  });

  it('buildRelease produces a valid, empty-but-consistent Release', () => {
    const release = buildRelease();
    expect(release.dependencies).toEqual([]);
    expect(release.capabilities).toEqual([]);
    expect(release.artifactIds).toEqual([]);
  });

  it('buildEvidence produces evidence satisfying the domain invariants (non-empty producedBy)', () => {
    const evidence = buildEvidence();
    expect(evidence.producedBy).toBe('test-builder');
    expect(evidence.sourceType).toBe('declared-metadata');
  });

  it('buildCompatibilityRule produces a rule that applies to any component-type pair by default', () => {
    const rule = buildCompatibilityRule();
    expect(rule.appliesTo).toEqual({ componentTypeA: null, componentTypeB: null });
  });

  it('buildCompatibilityRelationship defaults to "unverified" with no evidence — the only status ADR 0006 allows without one', () => {
    const relationship = buildCompatibilityRelationship();
    expect(relationship.status).toBe('unverified');
    expect(relationship.evidenceIds).toEqual([]);
  });

  it('buildCompatibilityRelationship accepts a compatible status when evidence is supplied', () => {
    const relationship = buildCompatibilityRelationship({
      status: 'compatible',
      evidenceIds: [buildEvidence().id],
    });
    expect(relationship.status).toBe('compatible');
  });

  it('buildBreakingChange auto-derives two consistent releases of the same component when none are given', () => {
    const change = buildBreakingChange();
    expect(change.fromReleaseId).not.toBe(change.toReleaseId);
  });

  it('buildBreakingChange respects explicitly given fromRelease/toRelease pairs', () => {
    const from = buildRelease({ componentId: buildComponent().id });
    const to = buildRelease({ componentId: from.componentId });
    const change = buildBreakingChange({ fromRelease: from, toRelease: to });
    expect(change.fromReleaseId).toBe(from.id);
    expect(change.toReleaseId).toBe(to.id);
    expect(change.componentId).toBe(from.componentId);
  });

  it('buildRisk produces a Risk with at least one contributing factor by default', () => {
    const risk = buildRisk();
    expect(risk.contributingFactors.length).toBeGreaterThan(0);
    expect(risk.level).toBe('low');
  });

  it('buildRecommendation defaults to "hold" with no targetReleaseId', () => {
    const recommendation = buildRecommendation();
    expect(recommendation.action).toBe('hold');
    expect(recommendation.targetReleaseId).toBeNull();
  });

  it('buildRecommendation accepts an "upgrade" action when a targetReleaseId is supplied', () => {
    const target = buildRelease();
    const recommendation = buildRecommendation({ action: 'upgrade', targetReleaseId: target.id });
    expect(recommendation.action).toBe('upgrade');
    expect(recommendation.targetReleaseId).toBe(target.id);
  });

  it('buildSnapshot produces an empty, valid Snapshot by default', () => {
    const snapshot = buildSnapshot();
    expect(snapshot.components).toEqual([]);
    expect(snapshot.releases).toEqual([]);
  });

  it('buildSnapshot merges overrides on top of the empty defaults', () => {
    const component = buildComponent();
    const snapshot = buildSnapshot({ components: [component] });
    expect(snapshot.components).toEqual([component]);
    expect(snapshot.releases).toEqual([]);
  });

  it('resetTestSequence restarts numbering from the beginning', () => {
    const before = buildComponent();
    resetTestSequence();
    const after = buildComponent();
    expect(before.id).toBe(after.id);
  });
});
