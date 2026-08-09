/** In-memory fakes for every application port, used across this package's use-case tests. */
import { compareTimestamps } from '@compass/domain';
import type { Snapshot, SnapshotId, Timestamp } from '@compass/domain';
import type { ClockPort } from '../src/ports/clock.port.js';
import type { IdGeneratorPort } from '../src/ports/id-generator.port.js';
import type { CapabilityExtractionResult, CapabilityExtractorPort } from '../src/ports/capability-extractor.port.js';
import type { IngestionContext } from '../src/ports/ingestion-context.js';
import type { RulePackPort } from '../src/ports/rule-pack.port.js';
import type { SnapshotFilter, SnapshotRepositoryPort, SnapshotSummary } from '../src/ports/snapshot-repository.port.js';
import type { DiscoveredRelease, SourceAdapterPort, SourceDiscoveryResult } from '../src/ports/source-adapter.port.js';
import type { Artifact, CompatibilityRule, RulePackId } from '@compass/domain';

export class FixedClock implements ClockPort {
  public constructor(private timestamp: Timestamp) {}
  public now(): Timestamp {
    return this.timestamp;
  }
  public advanceTo(timestamp: Timestamp): void {
    this.timestamp = timestamp;
  }
}

export class SequentialIdGenerator implements IdGeneratorPort {
  private readonly counters = new Map<string, number>();
  public next(kind: string): string {
    const count = (this.counters.get(kind) ?? 0) + 1;
    this.counters.set(kind, count);
    return `${kind}-${count}`;
  }
}

export class InMemorySnapshotRepository implements SnapshotRepositoryPort {
  private readonly snapshots: Snapshot[] = [];

  public save(snapshot: Snapshot): Promise<void> {
    this.snapshots.push(snapshot);
    return Promise.resolve();
  }

  public getLatest(): Promise<Snapshot | null> {
    if (this.snapshots.length === 0) return Promise.resolve(null);
    const latest = this.snapshots.reduce((current, candidate) =>
      compareTimestamps(candidate.createdAt, current.createdAt) > 0 ? candidate : current,
    );
    return Promise.resolve(latest);
  }

  public getById(id: SnapshotId): Promise<Snapshot | null> {
    return Promise.resolve(this.snapshots.find((snapshot) => snapshot.id === id) ?? null);
  }

  public list(filter?: SnapshotFilter): Promise<readonly SnapshotSummary[]> {
    const results = this.snapshots
      .filter((snapshot) => !filter?.before || compareTimestamps(snapshot.createdAt, filter.before) < 0)
      .filter((snapshot) => !filter?.after || compareTimestamps(snapshot.createdAt, filter.after) > 0)
      .map((snapshot) => ({ id: snapshot.id, createdAt: snapshot.createdAt }));
    return Promise.resolve(results);
  }
}

export class FakeSourceAdapter implements SourceAdapterPort {
  public constructor(
    public readonly name: string,
    private readonly resultFactory: (context: IngestionContext) => SourceDiscoveryResult,
  ) {}

  public discover(context: IngestionContext): Promise<SourceDiscoveryResult> {
    return Promise.resolve(this.resultFactory(context));
  }
}

export class FakeCapabilityExtractor implements CapabilityExtractorPort {
  public constructor(
    public readonly name: string,
    private readonly resultsFactory: (context: IngestionContext) => ReadonlyMap<string, CapabilityExtractionResult>,
  ) {}

  public extract(
    release: DiscoveredRelease,
    _artifacts: readonly Artifact[],
    context: IngestionContext,
  ): Promise<CapabilityExtractionResult> {
    const result = this.resultsFactory(context).get(release.id);
    if (result) return Promise.resolve(result);
    return Promise.resolve({ releaseId: release.id, capabilities: [], dependencies: [], evidence: [] });
  }
}

export class FakeRulePack implements RulePackPort {
  public constructor(
    public readonly id: RulePackId,
    public readonly name: string,
    private readonly ruleList: readonly CompatibilityRule[],
  ) {}

  public rules(): readonly CompatibilityRule[] {
    return this.ruleList;
  }
}
