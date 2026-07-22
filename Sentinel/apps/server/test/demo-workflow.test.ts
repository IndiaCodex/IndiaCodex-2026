import { describe, expect, it } from "vitest";
import { parseExecutionId, requiresSnapshot, verifyJournalChain } from "@sentinel/domain";
import { CaptureEventUseCase, type CaptureEventResult } from "@sentinel/application";
import { SentinelExecutionJournal } from "@sentinel/execution-journal";
import { InMemoryStorage } from "@sentinel/storage-memory";
import { MockMasumiAdapter } from "@sentinel/adapter-masumi";
import {
  CANONICAL_EXECUTION_ID,
  CANONICAL_WORKFLOW_ID,
  buildCanonicalWorkflowCommands,
} from "../src/demo/canonical-workflow.js";

/**
 * End-to-end test of the canonical demo execution (Step 3.2 §6): drives
 * the real Execution Capture pipeline through all nine events —
 * Customer Request/Agent Starts, Knowledge Retrieval, External Tool
 * Call, Decision Recorded, Payment Requested/Confirmed, Execution
 * Completed — and checks the properties later milestones (Replay,
 * Explainability, Export) will depend on.
 */
describe("canonical demo workflow", () => {
  it("captures all nine events, seals a valid artifact, and satisfies replay preconditions", async () => {
    const storage = new InMemoryStorage();
    const journal = new SentinelExecutionJournal(storage, "test-demo@0.0.0");
    const useCase = new CaptureEventUseCase(storage, journal, new MockMasumiAdapter());

    const commands = buildCanonicalWorkflowCommands();
    expect(commands).toHaveLength(9);

    let last: CaptureEventResult | undefined;
    for (const command of commands) {
      last = await useCase.execute(command);
    }

    // Execution reached a clean terminal state.
    expect(last!.execution.executionId).toBe(CANONICAL_EXECUTION_ID);
    expect(last!.execution.workflowId).toBe(CANONICAL_WORKFLOW_ID);
    expect(last!.execution.status).toBe("completed");
    expect(last!.execution.endedAt).not.toBeNull();
    expect(last!.execution.timeline).toHaveLength(9);

    // Event ordering: sequence numbers are exactly 0..8, no gaps or reordering.
    expect(last!.execution.timeline.map((event) => event.sequence)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ]);

    // Auto-sealing on completion (ADR-0006) produced a real artifact.
    const artifact = last!.sealedArtifact;
    expect(artifact).not.toBeNull();
    expect(artifact!.timeline).toHaveLength(9);
    expect(await storage.getArtifact(parseExecutionId(CANONICAL_EXECUTION_ID))).toEqual(artifact);

    // Hash chain integrity: the whole journal re-verifies independently.
    const executionId = parseExecutionId(CANONICAL_EXECUTION_ID);
    const entries = await storage.getJournalEntries(executionId);
    expect(entries).toHaveLength(9);
    expect(await verifyJournalChain(entries)).toBe(true);
    expect(artifact!.rootHash).toBe(entries[entries.length - 1]!.entryHash);

    // Replay preconditions (ADR-0001): every Event that requiresSnapshot
    // actually has one, and no Event that shouldn't have one does.
    for (const event of artifact!.timeline) {
      if (requiresSnapshot(event)) {
        expect(
          event.snapshotRef,
          `Event ${event.sequence} (${event.kind}) should carry a Snapshot`,
        ).not.toBeNull();
      } else {
        expect(
          event.snapshotRef,
          `Event ${event.sequence} (${event.kind}) should not carry a Snapshot`,
        ).toBeNull();
      }
    }
    // Four nondeterministic boundaries were actually captured: two
    // completed tool calls, one decision, one completed payment.
    expect(artifact!.snapshots).toHaveLength(4);

    // Payment Timeline tells a coherent requested -> confirmed story.
    const paymentEvents = artifact!.timeline.filter((event) => event.kind === "payment");
    expect(paymentEvents).toHaveLength(2);
    expect(paymentEvents[0]?.payload).toMatchObject({ phase: "requested" });
    expect(paymentEvents[1]?.payload).toMatchObject({ phase: "completed", state: "confirmed" });
  });

  it("rejects a replayed/duplicate 'started' event for the same execution (already terminal)", async () => {
    const storage = new InMemoryStorage();
    const journal = new SentinelExecutionJournal(storage, "test-demo@0.0.0");
    const useCase = new CaptureEventUseCase(storage, journal, new MockMasumiAdapter());

    const commands = buildCanonicalWorkflowCommands();
    for (const command of commands) {
      await useCase.execute(command);
    }

    await expect(useCase.execute(commands[0]!)).rejects.toMatchObject({
      reason: "EXECUTION_ALREADY_TERMINAL",
    });
  });
});
