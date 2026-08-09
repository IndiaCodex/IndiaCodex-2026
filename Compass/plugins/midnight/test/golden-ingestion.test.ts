/**
 * The end-to-end proof this milestone exists to deliver: ingest the real,
 * recorded Midnight ecosystem fixture through the full pipeline — the
 * MidnightSourceAdapter, both Capability Extractors, and the
 * MidnightRulePack — via the same `IngestSnapshotUseCase` used by any
 * ecosystem, and check the resulting Knowledge Graph against a golden
 * (checked-in) snapshot. If this test ever needs its snapshot updated,
 * that's a signal to read the diff carefully — it means real compatibility
 * conclusions changed, not just some code shuffled around.
 */
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCompatibilityMatrixView, semVerScheme, toTimestamp } from '@compass/domain';
import { IngestSnapshotUseCase } from '@compass/application';
import { FixedClock, InMemorySnapshotRepository, SequentialIdGenerator } from '@compass/testing';
import { CompactToolchainCapabilityExtractor } from '../src/compact-toolchain-capability-extractor.js';
import { MidnightRulePack } from '../src/midnight-rule-pack.js';
import { MidnightSourceAdapter } from '../src/midnight-source-adapter.js';
import { NpmManifestCapabilityExtractor } from '../src/npm-manifest-capability-extractor.js';
import { FixtureGitHubClient, loadFixture } from './fixture-github-client.js';

const FIXTURE_PATH = join(import.meta.dirname, 'fixtures/midnight-ecosystem.fixture.json');

function buildUseCase(): IngestSnapshotUseCase {
  const client = new FixtureGitHubClient(loadFixture(FIXTURE_PATH));
  return new IngestSnapshotUseCase({
    sourceAdapters: [new MidnightSourceAdapter(client)],
    capabilityExtractors: [new NpmManifestCapabilityExtractor(client), new CompactToolchainCapabilityExtractor(client)],
    rulePacks: [new MidnightRulePack()],
    snapshotRepository: new InMemorySnapshotRepository(),
    clock: new FixedClock(toTimestamp('2026-01-01T00:00:00.000Z')),
    idGenerator: new SequentialIdGenerator(),
    versionScheme: semVerScheme,
  });
}

describe('End-to-end ingestion of the real Midnight ecosystem fixture', () => {
  it('discovers every tracked component plus the synthetic Node.js runtime', async () => {
    const snapshot = await buildUseCase().execute();
    expect(snapshot.components.map((c) => c.id).sort()).toEqual(
      [
        'nodejs/node',
        'midnightntwrk/midnight-js',
        'midnightntwrk/compact',
        'midnightntwrk/midnight-node',
        'midnightntwrk/example-counter',
        'midnightntwrk/midnight-docs',
        'midnightntwrk/create-mn-app',
      ].sort(),
    );
  });

  it('finds example-counter\'s real declared dependency on midnight-js incompatible with the current midnight-js release', async () => {
    const snapshot = await buildUseCase().execute();
    const exampleCounter = snapshot.releases.find((r) => r.componentId === 'midnightntwrk/example-counter');
    const midnightJs = snapshot.releases.find(
      (r) => r.componentId === 'midnightntwrk/midnight-js' && r.version.raw === '5.0.0-beta.6',
    );
    expect(exampleCounter).toBeDefined();
    expect(midnightJs).toBeDefined();

    const relationship = snapshot.compatibilityRelationships.find(
      (rel) => rel.releaseAId === exampleCounter?.id && rel.releaseBId === midnightJs?.id,
    );
    expect(relationship).toBeDefined();
    // example-counter declares "^4.0.4"; 5.0.0-beta.6 is a different major version — genuinely violated.
    expect(relationship?.status).toBe('incompatible');
    expect(relationship?.evidenceIds.length).toBeGreaterThan(0);
  });

  it('finds example-counter\'s contract compatible with the compact toolchain via the real pragma + embedded language version', async () => {
    const snapshot = await buildUseCase().execute();
    const exampleCounter = snapshot.releases.find((r) => r.componentId === 'midnightntwrk/example-counter');
    const compactReleases = snapshot.releases.filter((r) => r.componentId === 'midnightntwrk/compact');

    const relationships = snapshot.compatibilityRelationships.filter(
      (rel) => rel.releaseAId === exampleCounter?.id && compactReleases.some((r) => r.id === rel.releaseBId),
    );
    expect(relationships.length).toBeGreaterThan(0);
    // pragma requires >=0.20; the latest tracked compact release provides compact-language 0.23.0.
    expect(relationships.some((rel) => rel.status === 'compatible')).toBe(true);
  });

  it('produces a mixed compatibility result for midnight-js against the three tracked Node.js releases', async () => {
    const snapshot = await buildUseCase().execute();
    const midnightJs = snapshot.releases.find(
      (r) => r.componentId === 'midnightntwrk/midnight-js' && r.version.raw === '5.0.0-beta.6',
    );
    const nodeRelationships = snapshot.compatibilityRelationships.filter(
      (rel) => rel.releaseAId === midnightJs?.id && rel.releaseBId.startsWith('nodejs/node@'),
    );

    // engines.node is ">=22": Node 22 satisfies it, Node 18/20 do not — a real, mixed result.
    expect(nodeRelationships.some((rel) => rel.status === 'compatible')).toBe(true);
    expect(nodeRelationships.some((rel) => rel.status === 'incompatible')).toBe(true);
  });

  it('computes a "high" risk for midnight-js, driven by its real incompatibility with older Node releases', async () => {
    const snapshot = await buildUseCase().execute();
    const midnightJsRisk = snapshot.risks.find(
      (risk) => risk.scope.kind === 'component' && risk.scope.componentId === 'midnightntwrk/midnight-js',
    );
    expect(midnightJsRisk?.level).toBe('high');
  });

  it('is fully deterministic end to end: two independent runs produce structurally identical snapshots', async () => {
    const first = await buildUseCase().execute();
    const second = await buildUseCase().execute();
    expect(first).toEqual(second);
  });

  it('matches the golden compatibility matrix view', async () => {
    const snapshot = await buildUseCase().execute();
    const matrix = buildCompatibilityMatrixView(snapshot.compatibilityRelationships, snapshot.releases);

    // Golden-snapshot the component-level shape only (not release-specific ids, which are stable
    // here but far less readable as a reviewable diff) — one row per directed component pair,
    // with the worst status among all release-level relationships between them.
    const summary = matrix.cells
      .map((cell) => ({ from: cell.componentAId, to: cell.componentBId, status: cell.status }))
      .sort((a, b) => `${a.from}->${a.to}`.localeCompare(`${b.from}->${b.to}`));

    expect(summary).toMatchSnapshot();
  });
});
