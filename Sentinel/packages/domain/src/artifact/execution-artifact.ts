import type { Brand } from "../shared/brand.js";
import { uuidv7 } from "../shared/uuid.js";
import type { Hash } from "../shared/hash.js";
import type { ExecutionId } from "../identity/execution-id.js";
import type { WorkflowId } from "../identity/workflow-id.js";
import type { CorrelationId } from "../identity/correlation-id.js";
import type { TraceId } from "../identity/trace-id.js";
import type { Event } from "../events/event.js";
import type { Snapshot } from "../snapshot/snapshot.js";
import type { JournalEntry } from "../journal/journal-entry.js";

export type ExecutionArtifactId = Brand<string, "ExecutionArtifactId">;

export const EXECUTION_ARTIFACT_SCHEMA_VERSION = "1.0.0";

export interface ExecutionArtifactProvenance {
  readonly sdkVersion: string;
  readonly journalVersion: string;
}

/**
 * The frozen, portable, content-addressable export of a completed
 * Execution's Journal — the unit that crosses process boundaries for
 * replay, CI, comparison, and audit export (ADR-0004). Immutable once
 * sealed; `signature` is populated only when Audit Export signing is
 * enabled (Phase 2, PRD §8).
 */
export interface ExecutionArtifact {
  readonly artifactId: ExecutionArtifactId;
  readonly executionId: ExecutionId;
  readonly workflowId: WorkflowId;
  readonly correlationId: CorrelationId;
  readonly traceId: TraceId;
  readonly timeline: readonly Event[];
  readonly snapshots: readonly Snapshot[];
  readonly rootHash: Hash;
  readonly sealedAt: Date;
  readonly schemaVersion: string;
  readonly producedBy: ExecutionArtifactProvenance;
  readonly signature: string | null;
}

export class SealValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SealValidationError";
  }
}

export interface SealJournalInput {
  readonly executionId: ExecutionId;
  readonly workflowId: WorkflowId;
  readonly correlationId: CorrelationId;
  readonly traceId: TraceId;
  readonly entries: readonly JournalEntry[];
  readonly producedBy: ExecutionArtifactProvenance;
  readonly sealedAt?: Date;
}

/**
 * Freezes a completed Journal into a portable Execution Artifact. Pure:
 * given the same entries, always produces the same `rootHash` — the
 * chain is already cumulative, so the root hash is simply the last
 * entry's `entryHash`. Re-validates that entries belong to the declared
 * execution and are contiguous from sequence 0; this is a cheap
 * defensive re-check of an invariant `appendJournalEntry` should already
 * have enforced on write, not a substitute for it.
 */
export function sealJournal(input: SealJournalInput): ExecutionArtifact {
  const { executionId, entries } = input;

  if (entries.length === 0) {
    throw new SealValidationError("Cannot seal an Execution Journal with no entries");
  }

  entries.forEach((entry, index) => {
    if (entry.executionId !== executionId) {
      throw new SealValidationError(
        `JournalEntry at index ${index} belongs to execution "${entry.executionId}", expected "${executionId}"`,
      );
    }
    if (entry.sequence !== index) {
      throw new SealValidationError(
        `JournalEntry sequence gap: expected ${index}, found ${entry.sequence}`,
      );
    }
  });

  const timeline = entries.map((entry) => entry.event);
  const snapshots = entries
    .map((entry) => entry.snapshot)
    .filter((snapshot): snapshot is Snapshot => snapshot !== null);
  const rootHash = entries[entries.length - 1]!.entryHash;

  return {
    artifactId: uuidv7() as ExecutionArtifactId,
    executionId,
    workflowId: input.workflowId,
    correlationId: input.correlationId,
    traceId: input.traceId,
    timeline,
    snapshots,
    rootHash,
    sealedAt: input.sealedAt ?? new Date(),
    schemaVersion: EXECUTION_ARTIFACT_SCHEMA_VERSION,
    producedBy: input.producedBy,
    signature: null,
  };
}
