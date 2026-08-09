import { describe, expect, it } from "vitest";
import { parseWorkflowId, type StoragePort } from "@sentinel/domain";
import {
  buildArtifact,
  buildExecution,
  buildJournalChain,
  buildLifecycleEvent,
  buildToolCompletedEvent,
  testExecutionId,
} from "@sentinel/testkit";

/**
 * A `StoragePort` implementation is only genuinely interchangeable
 * (ADR-0003) if every adapter satisfies the same behavioral contract,
 * not just the same method signatures. This suite is written once
 * against the `StoragePort` interface and run against every adapter —
 * `@sentinel/storage-memory` (the reference implementation) and
 * `@sentinel/storage-sqlite` both pass it unmodified.
 *
 * `createStorage` must return a fresh, empty StoragePort per call.
 */
export function runStoragePortContractTests(
  adapterName: string,
  createStorage: () => StoragePort | Promise<StoragePort>,
): void {
  describe(`StoragePort contract (${adapterName})`, () => {
    it("round-trips journal entries in append order", async () => {
      const storage = await createStorage();
      const executionId = testExecutionId();
      const first = buildLifecycleEvent(executionId, 0, "started");
      const { event: second, snapshot } = buildToolCompletedEvent(executionId, 1);
      const entries = await buildJournalChain([
        { event: first, snapshot: null },
        { event: second, snapshot },
      ]);

      for (const entry of entries) {
        await storage.appendJournalEntry(entry);
      }

      const read = await storage.getJournalEntries(executionId);
      expect(read.map((e) => e.sequence)).toEqual([0, 1]);
      expect(read[0]?.entryHash).toBe(entries[0]?.entryHash);
      expect(read[1]?.entryHash).toBe(entries[1]?.entryHash);
    });

    it("returns an empty array of journal entries for an unknown execution", async () => {
      const storage = await createStorage();
      expect(await storage.getJournalEntries(testExecutionId())).toEqual([]);
    });

    it("isolates journal entries between executions", async () => {
      const storage = await createStorage();
      const executionA = testExecutionId();
      const executionB = testExecutionId();
      const [entryA] = await buildJournalChain([
        { event: buildLifecycleEvent(executionA, 0), snapshot: null },
      ]);
      const [entryB] = await buildJournalChain([
        { event: buildLifecycleEvent(executionB, 0), snapshot: null },
      ]);

      await storage.appendJournalEntry(entryA!);
      await storage.appendJournalEntry(entryB!);

      expect((await storage.getJournalEntries(executionA)).map((e) => e.entryId)).toEqual([
        entryA!.entryId,
      ]);
      expect((await storage.getJournalEntries(executionB)).map((e) => e.entryId)).toEqual([
        entryB!.entryId,
      ]);
    });

    it("round-trips a saved Execution", async () => {
      const storage = await createStorage();
      const executionId = testExecutionId();
      const execution = buildExecution({ executionId, status: "running" });

      await storage.saveExecution(execution);

      expect(await storage.getExecution(executionId)).toEqual(execution);
    });

    it("returns null for an unknown Execution", async () => {
      const storage = await createStorage();
      expect(await storage.getExecution(testExecutionId())).toBeNull();
    });

    it("overwrites a saved Execution on re-save (mutable projection)", async () => {
      const storage = await createStorage();
      const executionId = testExecutionId();
      await storage.saveExecution(buildExecution({ executionId, status: "started" }));
      await storage.saveExecution(buildExecution({ executionId, status: "completed" }));

      expect((await storage.getExecution(executionId))?.status).toBe("completed");
    });

    it("searches Executions by workflowId, correlationId, and traceId", async () => {
      const storage = await createStorage();
      const target = buildExecution({ executionId: testExecutionId() });
      const other = buildExecution({
        executionId: testExecutionId(),
        workflowId: parseWorkflowId("other-workflow"),
      });
      await storage.saveExecution(target);
      await storage.saveExecution(other);

      expect(await storage.searchExecutions({ workflowId: target.workflowId })).toEqual([target]);
      expect(await storage.searchExecutions({ correlationId: target.correlationId })).toEqual([
        target,
      ]);
      expect(await storage.searchExecutions({ traceId: target.traceId })).toEqual([target]);
    });

    it("respects the search limit", async () => {
      const storage = await createStorage();
      const workflowId = buildExecution({ executionId: testExecutionId() }).workflowId;
      for (let i = 0; i < 3; i += 1) {
        await storage.saveExecution(buildExecution({ executionId: testExecutionId(), workflowId }));
      }

      const results = await storage.searchExecutions({ workflowId, limit: 2 });
      expect(results).toHaveLength(2);
    });

    it("round-trips a saved Execution Artifact", async () => {
      const storage = await createStorage();
      const executionId = testExecutionId();
      const entries = await buildJournalChain([
        { event: buildLifecycleEvent(executionId, 0), snapshot: null },
      ]);
      const artifact = buildArtifact(entries);

      await storage.saveArtifact(artifact);

      expect(await storage.getArtifact(executionId)).toEqual(artifact);
    });

    it("returns null for an unknown Execution Artifact", async () => {
      const storage = await createStorage();
      expect(await storage.getArtifact(testExecutionId())).toBeNull();
    });
  });
}
