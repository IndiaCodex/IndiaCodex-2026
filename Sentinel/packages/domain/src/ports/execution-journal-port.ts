import type { ExecutionId } from "../identity/execution-id.js";
import type { Event } from "../events/event.js";
import type { Snapshot } from "../snapshot/snapshot.js";
import type { JournalEntry } from "../journal/journal-entry.js";
import type { ExecutionArtifact } from "../artifact/execution-artifact.js";
import type { ReplaySession } from "../replay/replay-session.js";

/**
 * Records Events/Snapshots as a hash-chained Journal and replays that
 * Journal to deterministically reconstruct an Execution (ADR-0006).
 * Implemented by `packages/execution-journal`, built on top of
 * StoragePort. `append` is the Step 3.2 write path; `replay` and `seal`
 * land in Step 3.3 alongside the Replay Engine.
 */
export interface ExecutionJournalPort {
  append(event: Event, snapshot: Snapshot | null): Promise<JournalEntry>;
  readAll(executionId: ExecutionId): Promise<readonly JournalEntry[]>;
  seal(executionId: ExecutionId): Promise<ExecutionArtifact>;
  replay(executionId: ExecutionId): Promise<ReplaySession>;
}
