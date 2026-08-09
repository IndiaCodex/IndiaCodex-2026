import { beforeEach, describe, expect, it } from "vitest";
import {
  JournalCorruptionError,
  JournalInvariantViolation,
  ReplayIntegrityError,
} from "@sentinel/domain";
import { InMemoryStorage } from "@sentinel/storage-memory";
import {
  buildDecisionEvent,
  buildExecution,
  buildLifecycleEvent,
  buildToolCompletedEvent,
  buildToolInvokedEvent,
  testExecutionId,
} from "@sentinel/testkit";
import { SentinelExecutionJournal, UnknownExecutionError } from "../src/execution-journal.js";

describe("SentinelExecutionJournal", () => {
  let storage: InMemoryStorage;
  let journal: SentinelExecutionJournal;

  beforeEach(() => {
    storage = new InMemoryStorage();
    journal = new SentinelExecutionJournal(storage, "test-sdk@0.0.0");
  });

  it("appends events in order and persists them via StoragePort", async () => {
    const executionId = testExecutionId();
    const first = await journal.append(buildLifecycleEvent(executionId, 0, "started"), null);
    const second = await journal.append(buildToolInvokedEvent(executionId, 1), null);

    expect(second.previousEntryHash).toBe(first.entryHash);
    expect(await journal.readAll(executionId)).toEqual([first, second]);
  });

  it("propagates the domain's invariant violation for an out-of-order event", async () => {
    const executionId = testExecutionId();
    await expect(
      journal.append(buildLifecycleEvent(executionId, 3, "started"), null),
    ).rejects.toThrow(JournalInvariantViolation);
  });

  it("seals a Journal into an Execution Artifact with a matching rootHash", async () => {
    const executionId = testExecutionId();
    await storage.saveExecution(buildExecution({ executionId }));
    const first = await journal.append(buildLifecycleEvent(executionId, 0, "started"), null);
    const { event, snapshot } = buildToolCompletedEvent(executionId, 1);
    const second = await journal.append(event, snapshot);

    const artifact = await journal.seal(executionId);

    expect(artifact.executionId).toBe(executionId);
    expect(artifact.rootHash).toBe(second.entryHash);
    expect(artifact.timeline).toEqual([first.event, second.event]);
    expect(artifact.snapshots).toEqual([snapshot]);
    expect(artifact.producedBy).toEqual({
      sdkVersion: "test-sdk@0.0.0",
      journalVersion: "0.1.0",
    });
  });

  it("persists the sealed artifact so it can be retrieved from storage directly", async () => {
    const executionId = testExecutionId();
    await storage.saveExecution(buildExecution({ executionId }));
    await journal.append(buildLifecycleEvent(executionId, 0, "started"), null);

    const artifact = await journal.seal(executionId);

    expect(await storage.getArtifact(executionId)).toEqual(artifact);
  });

  it("is idempotent: sealing twice returns the same artifact, not a new one", async () => {
    const executionId = testExecutionId();
    await storage.saveExecution(buildExecution({ executionId }));
    await journal.append(buildLifecycleEvent(executionId, 0, "started"), null);

    const first = await journal.seal(executionId);
    const second = await journal.seal(executionId);

    expect(second.artifactId).toBe(first.artifactId);
  });

  it("refuses to seal an execution with no journal entries", async () => {
    await expect(journal.seal(testExecutionId())).rejects.toThrow(UnknownExecutionError);
  });

  it("refuses to seal when the Execution read model is missing", async () => {
    const executionId = testExecutionId();
    await journal.append(buildLifecycleEvent(executionId, 0, "started"), null);
    // Deliberately never called storage.saveExecution — simulates the
    // read-model projection falling out of sync with the Journal.
    await expect(journal.seal(executionId)).rejects.toThrow(UnknownExecutionError);
  });

  it("detects a corrupted journal and refuses to seal it", async () => {
    const executionId = testExecutionId();
    await storage.saveExecution(buildExecution({ executionId }));
    const entry = await journal.append(buildLifecycleEvent(executionId, 0, "started"), null);

    // Simulate corruption that bypassed appendJournalEntry entirely,
    // e.g. a row edited directly in a database.
    await storage.appendJournalEntry({
      ...entry,
      sequence: 1,
      entryHash: entry.entryHash, // stale hash, no longer matches recomputed content
    });

    await expect(journal.seal(executionId)).rejects.toThrow(JournalCorruptionError);
  });

  describe("replay", () => {
    it("seals (if needed) and deterministically replays the sealed artifact", async () => {
      const executionId = testExecutionId();
      await storage.saveExecution(buildExecution({ executionId }));
      const first = await journal.append(buildLifecycleEvent(executionId, 0, "started"), null);
      const { event: toolEvent, snapshot: toolSnapshot } = buildToolCompletedEvent(executionId, 1);
      const second = await journal.append(toolEvent, toolSnapshot);
      const { event: decisionEvent, snapshot: decisionSnapshot } = buildDecisionEvent(
        executionId,
        2,
      );
      const third = await journal.append(decisionEvent, decisionSnapshot);

      const session = await journal.replay(executionId);

      expect(session.sourceExecutionId).toBe(executionId);
      expect(session.replayedTimeline).toEqual([first.event, second.event, third.event]);
      expect(session.replayedSnapshots).toEqual([toolSnapshot, decisionSnapshot]);
      expect(session.fidelity).toBe("identical");
      expect(session.verification.valid).toBe(true);

      // Sealing happened as a side effect of replay.
      expect(await storage.getArtifact(executionId)).not.toBeNull();
    });

    it("replaying an already-sealed execution does not create a second artifact", async () => {
      const executionId = testExecutionId();
      await storage.saveExecution(buildExecution({ executionId }));
      await journal.append(buildLifecycleEvent(executionId, 0, "started"), null);
      const sealed = await journal.seal(executionId);

      await journal.replay(executionId);

      const artifact = await storage.getArtifact(executionId);
      expect(artifact?.artifactId).toBe(sealed.artifactId);
    });

    it("validates journal integrity before replay: a corrupted live journal fails at the seal step", async () => {
      const executionId = testExecutionId();
      await storage.saveExecution(buildExecution({ executionId }));
      const entry = await journal.append(buildLifecycleEvent(executionId, 0, "started"), null);
      await storage.appendJournalEntry({ ...entry, sequence: 1, entryHash: entry.entryHash });

      await expect(journal.replay(executionId)).rejects.toThrow(JournalCorruptionError);
    });

    it("validates artifact integrity before replay: a corrupted sealed artifact fails at the replay step", async () => {
      const executionId = testExecutionId();
      await storage.saveExecution(buildExecution({ executionId }));
      await journal.append(buildLifecycleEvent(executionId, 0, "started"), null);
      const { event: toolEvent, snapshot: toolSnapshot } = buildToolCompletedEvent(executionId, 1);
      await journal.append(toolEvent, toolSnapshot);
      const sealed = await journal.seal(executionId);

      // Strip the Snapshot the tool-completed Event depends on, bypassing
      // the Journal entirely — simulates tampering with a stored artifact.
      await storage.saveArtifact({ ...sealed, snapshots: [] });

      await expect(journal.replay(executionId)).rejects.toThrow(ReplayIntegrityError);
    });

    it("refuses to replay an unknown execution", async () => {
      await expect(journal.replay(testExecutionId())).rejects.toThrow(UnknownExecutionError);
    });
  });
});
