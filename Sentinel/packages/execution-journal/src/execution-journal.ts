import {
  JournalCorruptionError,
  replayArtifact,
  sealJournal,
  verifyJournalChain,
  type Event,
  type ExecutionArtifact,
  type ExecutionArtifactProvenance,
  type ExecutionId,
  type ExecutionJournalPort,
  type JournalEntry,
  type ReplaySession,
  type Snapshot,
  type StoragePort,
} from "@sentinel/domain";
import { appendJournalEntry } from "@sentinel/domain";

/** The Execution Journal's own build identifier, embedded in every sealed Artifact's provenance. */
export const EXECUTION_JOURNAL_VERSION = "0.1.0";

export class UnknownExecutionError extends Error {
  constructor(public readonly executionId: ExecutionId) {
    super(`No Execution found for executionId "${executionId}"`);
    this.name = "UnknownExecutionError";
  }
}

/**
 * Implements `ExecutionJournalPort` (ADR-0006): records Events/Snapshots
 * as a hash-chained, append-only Journal on top of `StoragePort`, seals
 * a completed Journal into a tamper-evident `ExecutionArtifact`
 * (ADR-0004), and replays a sealed artifact deterministically
 * (ADR-0001, Step 3.3). Sealing is idempotent — re-sealing an
 * already-sealed execution returns the existing artifact rather than
 * minting a new `artifactId` for identical content.
 */
export class SentinelExecutionJournal implements ExecutionJournalPort {
  constructor(
    private readonly storage: StoragePort,
    private readonly defaultSdkVersion = "unknown",
  ) {}

  async append(event: Event, snapshot: Snapshot | null): Promise<JournalEntry> {
    const priorEntries = await this.storage.getJournalEntries(event.executionId);
    const entry = await appendJournalEntry(priorEntries, event, snapshot);
    await this.storage.appendJournalEntry(entry);
    return entry;
  }

  readAll(executionId: ExecutionId): Promise<readonly JournalEntry[]> {
    return this.storage.getJournalEntries(executionId);
  }

  async seal(
    executionId: ExecutionId,
    provenance?: Partial<ExecutionArtifactProvenance>,
  ): Promise<ExecutionArtifact> {
    const existing = await this.storage.getArtifact(executionId);
    if (existing) {
      return existing;
    }

    const entries = await this.storage.getJournalEntries(executionId);
    if (entries.length === 0) {
      throw new UnknownExecutionError(executionId);
    }

    const intact = await verifyJournalChain(entries);
    if (!intact) {
      throw new JournalCorruptionError(
        executionId,
        `Hash chain verification failed for execution "${executionId}" — the stored Journal has been altered since it was written`,
      );
    }

    const execution = await this.storage.getExecution(executionId);
    if (!execution) {
      throw new UnknownExecutionError(executionId);
    }

    const artifact = sealJournal({
      executionId,
      workflowId: execution.workflowId,
      correlationId: execution.correlationId,
      traceId: execution.traceId,
      entries,
      producedBy: {
        sdkVersion: provenance?.sdkVersion ?? this.defaultSdkVersion,
        journalVersion: provenance?.journalVersion ?? EXECUTION_JOURNAL_VERSION,
      },
    });

    await this.storage.saveArtifact(artifact);
    return artifact;
  }

  /**
   * Replays an Execution deterministically: seals the Journal if it
   * isn't already sealed (which validates the live journal's hash chain
   * via `verifyJournalChain` — journal integrity, checked first), then
   * replays the resulting artifact (which independently re-verifies the
   * artifact's own hash chain and root hash via `verifyArtifact` —
   * artifact integrity, checked second). Never invokes an LLM, external
   * API, live tool, or Masumi service; operates only on data already in
   * the Journal.
   */
  async replay(executionId: ExecutionId): Promise<ReplaySession> {
    const artifact = await this.seal(executionId);
    return replayArtifact(artifact);
  }
}
