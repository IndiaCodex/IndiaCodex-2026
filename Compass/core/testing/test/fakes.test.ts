import { describe, expect, it } from 'vitest';
import { toRulePackId, toSnapshotId, toTimestamp } from '@compass/domain';
import {
  FakeCapabilityExtractor,
  FakeRulePack,
  FakeSourceAdapter,
  FixedClock,
  InMemorySnapshotRepository,
  SequentialIdGenerator,
} from '../src/index.js';
import { buildEvidence, buildRelease } from '../src/builders.js';

describe('FixedClock', () => {
  it('always returns the fixed timestamp until advanced', () => {
    const t1 = toTimestamp('2026-01-01T00:00:00.000Z');
    const t2 = toTimestamp('2026-02-01T00:00:00.000Z');
    const clock = new FixedClock(t1);
    expect(clock.now()).toBe(t1);
    expect(clock.now()).toBe(t1);
    clock.advanceTo(t2);
    expect(clock.now()).toBe(t2);
  });
});

describe('SequentialIdGenerator', () => {
  it('produces unique, incrementing ids per kind', () => {
    const gen = new SequentialIdGenerator();
    expect(gen.next('release')).toBe('release-1');
    expect(gen.next('release')).toBe('release-2');
    expect(gen.next('evidence')).toBe('evidence-1');
  });
});

describe('InMemorySnapshotRepository', () => {
  it('returns null from getLatest and getById when nothing has been saved', async () => {
    const repo = new InMemorySnapshotRepository();
    expect(await repo.getLatest()).toBeNull();
    expect(await repo.getById(toSnapshotId('missing'))).toBeNull();
    expect(await repo.list()).toEqual([]);
    expect(repo.count()).toBe(0);
  });

  it('getLatest returns the snapshot with the most recent createdAt, regardless of save order', async () => {
    const repo = new InMemorySnapshotRepository();
    const older = {
      id: toSnapshotId('s1'),
      createdAt: toTimestamp('2026-01-01T00:00:00.000Z'),
      repositories: [],
      components: [],
      releases: [],
      artifacts: [],
      evidence: [],
      compatibilityRules: [],
      compatibilityRelationships: [],
      breakingChanges: [],
      risks: [],
      recommendations: [],
    };
    const newer = { ...older, id: toSnapshotId('s2'), createdAt: toTimestamp('2026-06-01T00:00:00.000Z') };

    await repo.save(older);
    await repo.save(newer);

    expect((await repo.getLatest())?.id).toBe(newer.id);
    expect(repo.count()).toBe(2);
  });

  it('getLatest keeps the running latest when a later-saved snapshot is actually older', async () => {
    const repo = new InMemorySnapshotRepository();
    const newer = {
      id: toSnapshotId('s1'),
      createdAt: toTimestamp('2026-06-01T00:00:00.000Z'),
      repositories: [],
      components: [],
      releases: [],
      artifacts: [],
      evidence: [],
      compatibilityRules: [],
      compatibilityRelationships: [],
      breakingChanges: [],
      risks: [],
      recommendations: [],
    };
    const olderSavedSecond = { ...newer, id: toSnapshotId('s2'), createdAt: toTimestamp('2026-01-01T00:00:00.000Z') };

    await repo.save(newer);
    await repo.save(olderSavedSecond);

    expect((await repo.getLatest())?.id).toBe(newer.id);
  });

  it('list() filters by before/after', async () => {
    const repo = new InMemorySnapshotRepository();
    const early = {
      id: toSnapshotId('s1'),
      createdAt: toTimestamp('2026-01-01T00:00:00.000Z'),
      repositories: [],
      components: [],
      releases: [],
      artifacts: [],
      evidence: [],
      compatibilityRules: [],
      compatibilityRelationships: [],
      breakingChanges: [],
      risks: [],
      recommendations: [],
    };
    const late = { ...early, id: toSnapshotId('s2'), createdAt: toTimestamp('2026-06-01T00:00:00.000Z') };
    await repo.save(early);
    await repo.save(late);

    const beforeMid = await repo.list({ before: toTimestamp('2026-03-01T00:00:00.000Z') });
    expect(beforeMid.map((s) => s.id)).toEqual([early.id]);

    const afterMid = await repo.list({ after: toTimestamp('2026-03-01T00:00:00.000Z') });
    expect(afterMid.map((s) => s.id)).toEqual([late.id]);
  });
});

describe('FakeSourceAdapter / FakeCapabilityExtractor / FakeRulePack', () => {
  it('FakeSourceAdapter invokes its factory with the given ingestion context', async () => {
    const context = { snapshotId: toSnapshotId('snap-1'), collectedAt: toTimestamp('2026-01-01T00:00:00.000Z') };
    const adapter = new FakeSourceAdapter('test', (ctx) => ({
      repositories: [],
      components: [],
      releases: [],
      evidence: [buildEvidence({ snapshotId: ctx.snapshotId, collectedAt: ctx.collectedAt })],
    }));
    const result = await adapter.discover(context);
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0]?.snapshotId).toBe(context.snapshotId);
  });

  it('FakeCapabilityExtractor returns the mapped result for a release present in its map', async () => {
    const release = buildRelease();
    const mapped = { releaseId: release.id, capabilities: [], dependencies: [], evidence: [] };
    const extractor = new FakeCapabilityExtractor('test', () => new Map([[release.id, mapped]]));
    const context = { snapshotId: toSnapshotId('snap-1'), collectedAt: toTimestamp('2026-01-01T00:00:00.000Z') };
    const result = await extractor.extract(
      { id: release.id, componentId: release.componentId, version: release.version, publishedAt: release.publishedAt, artifacts: [] },
      [],
      context,
    );
    expect(result).toBe(mapped);
  });

  it('FakeCapabilityExtractor returns an empty result for an unmapped release', async () => {
    const extractor = new FakeCapabilityExtractor('test', () => new Map());
    const release = buildRelease();
    const context = { snapshotId: toSnapshotId('snap-1'), collectedAt: toTimestamp('2026-01-01T00:00:00.000Z') };
    const result = await extractor.extract(
      { id: release.id, componentId: release.componentId, version: release.version, publishedAt: release.publishedAt, artifacts: [] },
      [],
      context,
    );
    expect(result).toEqual({ releaseId: release.id, capabilities: [], dependencies: [], evidence: [] });
  });

  it('FakeRulePack returns exactly the rules it was constructed with', () => {
    const pack = new FakeRulePack(toRulePackId('pack-1'), 'test-pack', []);
    expect(pack.rules()).toEqual([]);
    expect(pack.name).toBe('test-pack');
  });
});
