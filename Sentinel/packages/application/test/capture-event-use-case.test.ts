import { beforeEach, describe, expect, it } from "vitest";
import type { MasumiAdapterPort, PaymentPayload } from "@sentinel/domain";
import { InMemoryStorage } from "@sentinel/storage-memory";
import { SentinelExecutionJournal } from "@sentinel/execution-journal";
import { MockMasumiAdapter } from "@sentinel/adapter-masumi";
import { testExecutionId, testWorkflowId } from "@sentinel/testkit";
import { CaptureEventUseCase } from "../src/capture/capture-event-use-case.js";
import { EventCaptureError } from "../src/capture/errors.js";
import type { CaptureEventCommand } from "../src/capture/commands.js";

/** A `MasumiAdapterPort` that always fails — used to prove capture never blocks on Masumi being reachable. */
class UnreachableMasumiAdapter implements MasumiAdapterPort {
  enrichPayment(): Promise<PaymentPayload> {
    return Promise.reject(new Error("Masumi is unreachable"));
  }
}

/** A `MasumiAdapterPort` that records every payload it was asked to enrich. */
class RecordingMasumiAdapter implements MasumiAdapterPort {
  public readonly seen: PaymentPayload[] = [];

  enrichPayment(payload: PaymentPayload): Promise<PaymentPayload> {
    this.seen.push(payload);
    return Promise.resolve(
      payload.phase === "completed" && !payload.masumiReference
        ? { ...payload, masumiReference: `recorded_${payload.paymentId}` }
        : payload,
    );
  }
}

function startedCommand(overrides: Partial<CaptureEventCommand> = {}): CaptureEventCommand {
  return {
    executionId: testExecutionId(),
    workflowId: testWorkflowId(),
    sequence: 0,
    kind: "lifecycle",
    payload: { transition: "started" },
    ...overrides,
  } as CaptureEventCommand;
}

/** Fails the test explicitly if `promise` resolves, or rejects with something other than an `EventCaptureError`. */
async function expectCaptureError(promise: Promise<unknown>): Promise<EventCaptureError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(EventCaptureError);
    return error as EventCaptureError;
  }
  throw new Error("Expected the Execution Capture pipeline to reject this event, but it did not");
}

describe("CaptureEventUseCase", () => {
  let storage: InMemoryStorage;
  let useCase: CaptureEventUseCase;

  beforeEach(() => {
    storage = new InMemoryStorage();
    useCase = new CaptureEventUseCase(
      storage,
      new SentinelExecutionJournal(storage),
      new MockMasumiAdapter(),
    );
  });

  it("captures a lifecycle 'started' event and creates the Execution", async () => {
    const executionId = testExecutionId();
    const result = await useCase.execute(startedCommand({ executionId, sequence: 0 }));

    expect(result.execution.status).toBe("started");
    expect(result.execution.executionId).toBe(executionId);
    expect(result.execution.endedAt).toBeNull();
    expect(result.sealedArtifact).toBeNull();
    expect(await storage.getExecution(executionId)).toEqual(result.execution);
  });

  it("captures the full canonical workflow shape and auto-seals on completion", async () => {
    const executionId = testExecutionId();
    const workflowId = testWorkflowId();

    await useCase.execute(startedCommand({ executionId, workflowId, sequence: 0 }));
    await useCase.execute({
      executionId,
      workflowId,
      sequence: 1,
      kind: "tool",
      payload: { phase: "invoked", toolName: "kb_search", arguments: { query: "refund policy" } },
    });
    const toolCompleted = await useCase.execute({
      executionId,
      workflowId,
      sequence: 2,
      kind: "tool",
      payload: {
        phase: "completed",
        toolName: "kb_search",
        arguments: { query: "refund policy" },
        result: { articles: ["kb-1"] },
      },
      snapshot: {
        kind: "tool-call",
        request: { query: "refund policy" },
        response: { articles: ["kb-1"] },
      },
    });
    expect(toolCompleted.entry.snapshot).not.toBeNull();

    await useCase.execute({
      executionId,
      workflowId,
      sequence: 3,
      kind: "decision",
      payload: { summary: "issue refund", inputRefs: [2] },
      snapshot: {
        kind: "llm-call",
        request: { prompt: "decide" },
        response: { text: "issue refund" },
      },
    });
    await useCase.execute({
      executionId,
      workflowId,
      sequence: 4,
      kind: "payment",
      payload: { phase: "requested", paymentId: "pay_1", amount: "4.50", currency: "ADA" },
    });
    await useCase.execute({
      executionId,
      workflowId,
      sequence: 5,
      kind: "payment",
      payload: {
        phase: "completed",
        paymentId: "pay_1",
        amount: "4.50",
        currency: "ADA",
        state: "confirmed",
      },
      snapshot: {
        kind: "external-api-call",
        request: { paymentId: "pay_1" },
        response: { state: "confirmed" },
      },
    });

    const final = await useCase.execute({
      executionId,
      workflowId,
      sequence: 6,
      kind: "lifecycle",
      payload: { transition: "completed" },
    });

    expect(final.execution.status).toBe("completed");
    expect(final.execution.endedAt).not.toBeNull();
    expect(final.execution.timeline).toHaveLength(7);
    expect(final.sealedArtifact).not.toBeNull();
    expect(final.sealedArtifact?.timeline).toHaveLength(7);
    expect(await storage.getArtifact(executionId)).toEqual(final.sealedArtifact);
  });

  it("rejects the first event for an execution when it isn't a lifecycle 'started' event", async () => {
    const error = await expectCaptureError(
      useCase.execute({
        executionId: testExecutionId(),
        workflowId: testWorkflowId(),
        sequence: 0,
        kind: "lifecycle",
        payload: { transition: "completed" },
      }),
    );

    expect(error.reason).toBe("UNKNOWN_EXECUTION");
  });

  it("rejects an envelope that fails schema validation", async () => {
    const error = await expectCaptureError(
      useCase.execute({ executionId: "", workflowId: "not a slug!!", sequence: -1 }),
    );

    expect(error.reason).toBe("INVALID_ENVELOPE");
  });

  it("rejects an out-of-order sequence number", async () => {
    const executionId = testExecutionId();
    await useCase.execute(startedCommand({ executionId, sequence: 0 }));

    const error = await expectCaptureError(
      useCase.execute(
        startedCommand({ executionId, sequence: 5, payload: { transition: "retried" } }),
      ),
    );

    expect(error.reason).toBe("JOURNAL_INVARIANT_VIOLATION");
  });

  it("rejects a tool 'completed' event with no Snapshot", async () => {
    const executionId = testExecutionId();
    await useCase.execute(startedCommand({ executionId, sequence: 0 }));

    const error = await expectCaptureError(
      useCase.execute({
        executionId,
        workflowId: testWorkflowId(),
        sequence: 1,
        kind: "tool",
        payload: { phase: "completed", toolName: "x", arguments: {}, result: {} },
      }),
    );

    expect(error.reason).toBe("JOURNAL_INVARIANT_VIOLATION");
  });

  it("rejects a later event whose workflowId doesn't match the Execution's", async () => {
    const executionId = testExecutionId();
    await useCase.execute(startedCommand({ executionId, sequence: 0 }));

    const error = await expectCaptureError(
      useCase.execute(
        startedCommand({
          executionId,
          sequence: 1,
          workflowId: "a-different-workflow",
          payload: { transition: "retried" },
        }),
      ),
    );

    expect(error.reason).toBe("IDENTITY_MISMATCH");
  });

  it("rejects a later event whose traceId doesn't match the Execution's", async () => {
    const executionId = testExecutionId();
    const first = await useCase.execute(startedCommand({ executionId, sequence: 0 }));
    const lastChar = first.execution.traceId.slice(-1);
    const flippedChar = lastChar === "0" ? "1" : "0"; // guaranteed different, regardless of the real traceId

    const error = await expectCaptureError(
      useCase.execute(
        startedCommand({
          executionId,
          sequence: 1,
          traceId: `${first.execution.traceId.slice(0, -1)}${flippedChar}`,
          payload: { transition: "retried" },
        }),
      ),
    );

    expect(error.reason).toBe("IDENTITY_MISMATCH");
  });

  it("rejects any event once the Execution has reached a terminal status", async () => {
    const executionId = testExecutionId();
    await useCase.execute(startedCommand({ executionId, sequence: 0 }));
    await useCase.execute(
      startedCommand({ executionId, sequence: 1, payload: { transition: "completed" } }),
    );

    const error = await expectCaptureError(
      useCase.execute(
        startedCommand({ executionId, sequence: 2, payload: { transition: "retried" } }),
      ),
    );

    expect(error.reason).toBe("EXECUTION_ALREADY_TERMINAL");
  });

  it("inherits traceId/correlationId from the Execution when a later event omits them", async () => {
    const executionId = testExecutionId();
    const first = await useCase.execute(startedCommand({ executionId, sequence: 0 }));

    const second = await useCase.execute(
      startedCommand({ executionId, sequence: 1, payload: { transition: "retried" } }),
    );

    expect(second.execution.traceId).toBe(first.execution.traceId);
    expect(second.execution.correlationId).toBe(first.execution.correlationId);
  });

  describe("Masumi enrichment", () => {
    it("routes a 'completed' payment through MasumiAdapterPort and persists the enriched payload", async () => {
      const masumiAdapter = new RecordingMasumiAdapter();
      const captureUseCase = new CaptureEventUseCase(
        storage,
        new SentinelExecutionJournal(storage),
        masumiAdapter,
      );
      const executionId = testExecutionId();
      await captureUseCase.execute(startedCommand({ executionId, sequence: 0 }));

      const result = await captureUseCase.execute({
        executionId,
        workflowId: testWorkflowId(),
        sequence: 1,
        kind: "payment",
        payload: {
          phase: "completed",
          paymentId: "pay_enrich_1",
          amount: "10.00",
          currency: "ADA",
          state: "confirmed",
        },
        snapshot: {
          kind: "external-api-call",
          request: { paymentId: "pay_enrich_1" },
          response: { state: "confirmed" },
        },
      });

      expect(masumiAdapter.seen).toHaveLength(1);
      expect(masumiAdapter.seen[0]).toMatchObject({ paymentId: "pay_enrich_1" });
      expect(result.entry.event.payload).toMatchObject({
        masumiReference: "recorded_pay_enrich_1",
      });
      expect(result.execution.timeline.at(-1)?.payload).toMatchObject({
        masumiReference: "recorded_pay_enrich_1",
      });
    });

    it("does not call MasumiAdapterPort for a non-payment event", async () => {
      const masumiAdapter = new RecordingMasumiAdapter();
      const captureUseCase = new CaptureEventUseCase(
        storage,
        new SentinelExecutionJournal(storage),
        masumiAdapter,
      );

      await captureUseCase.execute(startedCommand({ sequence: 0 }));

      expect(masumiAdapter.seen).toHaveLength(0);
    });

    it("captures the payment as reported when Masumi is unreachable, instead of failing capture", async () => {
      const captureUseCase = new CaptureEventUseCase(
        storage,
        new SentinelExecutionJournal(storage),
        new UnreachableMasumiAdapter(),
      );
      const executionId = testExecutionId();
      await captureUseCase.execute(startedCommand({ executionId, sequence: 0 }));

      const result = await captureUseCase.execute({
        executionId,
        workflowId: testWorkflowId(),
        sequence: 1,
        kind: "payment",
        payload: {
          phase: "completed",
          paymentId: "pay_unreachable",
          amount: "5.00",
          currency: "ADA",
          state: "confirmed",
        },
        snapshot: {
          kind: "external-api-call",
          request: { paymentId: "pay_unreachable" },
          response: { state: "confirmed" },
        },
      });

      expect(result.entry.event.payload).toMatchObject({
        paymentId: "pay_unreachable",
        state: "confirmed",
      });
      expect(
        (result.entry.event.payload as { masumiReference?: string }).masumiReference,
      ).toBeUndefined();
    });
  });
});
