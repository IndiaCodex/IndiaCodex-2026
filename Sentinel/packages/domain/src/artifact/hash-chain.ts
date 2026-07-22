import { sha256Hex, type Hash } from "../shared/hash.js";
import type { Snapshot, SnapshotId } from "../snapshot/snapshot.js";
import type { Event } from "../events/event.js";
import type { ExecutionArtifact } from "./execution-artifact.js";

export interface HashChainEntry {
  readonly sequence: number;
  readonly previousEntryHash: Hash | null;
  readonly entryHash: Hash;
}

export interface RecomputedHashChain {
  readonly entries: readonly HashChainEntry[];
  readonly rootHash: Hash | null;
}

/**
 * Recomputes an Execution Artifact's hash chain from its `timeline` and
 * `snapshots` alone — no access to the original JournalEntry rows is
 * needed. This is what makes an exported artifact genuinely portable
 * (ADR-0004): the same hash formula `appendJournalEntry` used at write
 * time (`sha256Hex({ previousEntryHash, event, snapshot })`), walked
 * forward from `null`, run only against data embedded in the artifact
 * itself. `verifyArtifact` and `assembleExecutionAuditExport` both
 * build on this one implementation so they can never compute the chain
 * two different ways.
 */
export async function recomputeHashChain(
  artifact: Pick<ExecutionArtifact, "timeline" | "snapshots">,
): Promise<RecomputedHashChain> {
  const snapshotsById = new Map<SnapshotId, Snapshot>(
    artifact.snapshots.map((snapshot) => [snapshot.snapshotId, snapshot]),
  );

  const entries: HashChainEntry[] = [];
  let previousEntryHash: Hash | null = null;

  for (const event of orderedByRecordedSequence(artifact.timeline)) {
    const snapshot = event.snapshotRef ? (snapshotsById.get(event.snapshotRef) ?? null) : null;
    const entryHash = await sha256Hex({ previousEntryHash, event, snapshot });
    entries.push({ sequence: event.sequence, previousEntryHash, entryHash });
    previousEntryHash = entryHash;
  }

  return { entries, rootHash: previousEntryHash };
}

function orderedByRecordedSequence(timeline: readonly Event[]): readonly Event[] {
  return [...timeline].sort((a, b) => a.sequence - b.sequence);
}
