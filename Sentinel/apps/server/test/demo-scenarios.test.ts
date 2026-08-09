import { describe, expect, it } from "vitest";
import { parseExecutionId } from "@sentinel/domain";
import { CaptureEventUseCase, type CaptureEventResult } from "@sentinel/application";
import { SentinelExecutionJournal } from "@sentinel/execution-journal";
import { InMemoryStorage } from "@sentinel/storage-memory";
import { MockMasumiAdapter } from "@sentinel/adapter-masumi";
import {
  TOOL_FAILURE_EXECUTION_ID,
  buildToolFailureWorkflowCommands,
} from "../src/demo/tool-failure-workflow.js";
import {
  PAYMENT_FAILURE_EXECUTION_ID,
  buildPaymentFailureWorkflowCommands,
} from "../src/demo/payment-failure-workflow.js";
import {
  INTERRUPTED_EXECUTION_ID,
  buildInterruptedWorkflowCommands,
} from "../src/demo/interrupted-workflow.js";

/**
 * Step 3.5's additional demo scenarios, driven through the real
 * pipeline exactly like the canonical workflow (demo-workflow.test.ts)
 * — proving each one is a genuine capture, not a fixture, and that the
 * assurance pipeline treats failure and interruption as first-class
 * outcomes rather than edge cases it degrades on.
 */
describe("demo scenario: tool failure", () => {
  it("captures a tool failure that terminates the execution", async () => {
    const storage = new InMemoryStorage();
    const journal = new SentinelExecutionJournal(storage, "test-demo@0.0.0");
    const useCase = new CaptureEventUseCase(storage, journal, new MockMasumiAdapter());

    let last: CaptureEventResult | undefined;
    for (const command of buildToolFailureWorkflowCommands()) {
      last = await useCase.execute(command);
    }

    expect(last!.execution.status).toBe("failed");
    expect(last!.sealedArtifact).not.toBeNull();

    const replay = await journal.replay(parseExecutionId(TOOL_FAILURE_EXECUTION_ID));
    expect(replay.verification.valid).toBe(true);

    const failedEvent = last!.execution.timeline.find(
      (event) => event.kind === "tool" && event.payload.phase === "completed",
    );
    expect(failedEvent?.kind).toBe("tool");
  });
});

describe("demo scenario: payment failure", () => {
  it("captures a declined payment that terminates the execution", async () => {
    const storage = new InMemoryStorage();
    const journal = new SentinelExecutionJournal(storage, "test-demo@0.0.0");
    const useCase = new CaptureEventUseCase(storage, journal, new MockMasumiAdapter());

    let last: CaptureEventResult | undefined;
    for (const command of buildPaymentFailureWorkflowCommands()) {
      last = await useCase.execute(command);
    }

    expect(last!.execution.status).toBe("failed");

    const paymentEvents = last!.execution.timeline.filter((event) => event.kind === "payment");
    expect(paymentEvents).toHaveLength(2);
    const completed = paymentEvents[1];
    expect(completed?.kind).toBe("payment");
    if (completed?.kind === "payment" && completed.payload.phase === "completed") {
      expect(completed.payload.state).toBe("failed");
    }

    const replay = await journal.replay(parseExecutionId(PAYMENT_FAILURE_EXECUTION_ID));
    expect(replay.verification.valid).toBe(true);
  });
});

describe("demo scenario: interrupted execution", () => {
  it("stays non-terminal, and can still be sealed, replayed, and verified", async () => {
    const storage = new InMemoryStorage();
    const journal = new SentinelExecutionJournal(storage, "test-demo@0.0.0");
    const useCase = new CaptureEventUseCase(storage, journal, new MockMasumiAdapter());

    let last: CaptureEventResult | undefined;
    for (const command of buildInterruptedWorkflowCommands()) {
      last = await useCase.execute(command);
    }

    expect(last!.execution.status).toBe("running");
    expect(last!.execution.endedAt).toBeNull();
    expect(last!.sealedArtifact).toBeNull(); // no auto-seal without a terminal lifecycle event

    // Replay/verification/export must still work on demand, even though
    // the execution never reached a terminal status.
    const replay = await journal.replay(parseExecutionId(INTERRUPTED_EXECUTION_ID));
    expect(replay.verification.valid).toBe(true);
    expect(replay.fidelity).toBe("identical");

    const artifact = await storage.getArtifact(parseExecutionId(INTERRUPTED_EXECUTION_ID));
    expect(artifact).not.toBeNull();
    expect(artifact?.timeline).toHaveLength(2);
  });
});
