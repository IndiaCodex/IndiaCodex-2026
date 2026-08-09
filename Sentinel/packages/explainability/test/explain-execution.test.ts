import { describe, expect, it } from "vitest";
import {
  appendJournalEntry,
  createTraceId,
  parseWorkflowId,
  resolveCorrelationId,
  sealJournal,
  verifyArtifact,
  type JournalEntry,
} from "@sentinel/domain";
import {
  buildDecisionEvent,
  buildLifecycleEvent,
  buildPaymentCompletedEvent,
  buildPaymentRequestedEvent,
  buildToolCompletedEvent,
  buildToolInvokedEvent,
  testExecutionId,
} from "@sentinel/testkit";
import { buildExplainabilityReport } from "../src/explain-execution.js";

async function buildScenarioArtifact(options: { fail?: boolean } = {}) {
  const executionId = testExecutionId();
  const entries: JournalEntry[] = [];
  const append = async (
    event: Parameters<typeof appendJournalEntry>[1],
    snapshot: Parameters<typeof appendJournalEntry>[2],
  ) => {
    const entry = await appendJournalEntry(entries, event, snapshot);
    entries.push(entry);
    return entry;
  };

  await append(buildLifecycleEvent(executionId, 0, "started"), null);
  await append(buildToolInvokedEvent(executionId, 1), null);
  const { event: toolCompleted, snapshot: toolSnapshot } = buildToolCompletedEvent(executionId, 2);
  await append(toolCompleted, toolSnapshot);
  const { event: decision, snapshot: decisionSnapshot } = buildDecisionEvent(executionId, 3, {
    inputRefs: [2],
  });
  await append(decision, decisionSnapshot);
  await append(buildPaymentRequestedEvent(executionId, 4, { paymentId: "pay_1" }), null);
  const { event: paymentCompleted, snapshot: paymentSnapshot } = buildPaymentCompletedEvent(
    executionId,
    5,
    {
      paymentId: "pay_1",
      state: options.fail ? "failed" : "confirmed",
    },
  );
  await append(paymentCompleted, paymentSnapshot);

  if (options.fail) {
    await append(buildLifecycleEvent(executionId, 6, "failed"), null);
  } else {
    await append(buildLifecycleEvent(executionId, 6, "completed"), null);
  }

  const artifact = sealJournal({
    executionId,
    workflowId: parseWorkflowId("support-agent"),
    correlationId: resolveCorrelationId(executionId),
    traceId: createTraceId(),
    entries,
    producedBy: { sdkVersion: "test@0.0.0", journalVersion: "test@0.0.0" },
  });

  return artifact;
}

describe("buildExplainabilityReport", () => {
  it("summarizes a successful execution", async () => {
    const artifact = await buildScenarioArtifact();
    const verification = await verifyArtifact(artifact);

    const report = buildExplainabilityReport({ artifact, verification, replay: null });

    expect(report.executionSummary.outcome).toBe("completed");
    expect(report.executionSummary.eventCount).toBe(7);
    expect(report.executionSummary.toolInvocationCount).toBe(1);
    expect(report.executionSummary.decisionCount).toBe(1);
    expect(report.executionSummary.paymentCount).toBe(1);
    expect(report.executionSummary.durationMs).not.toBeNull();
    expect(report.failure.failed).toBe(false);
    expect(report.timelineSummary).toHaveLength(7);
  });

  it("summarizes a failed execution with the failure reason", async () => {
    const executionId = testExecutionId();
    const entries: JournalEntry[] = [];
    const append = async (
      event: Parameters<typeof appendJournalEntry>[1],
      snapshot: Parameters<typeof appendJournalEntry>[2],
    ) => {
      const entry = await appendJournalEntry(entries, event, snapshot);
      entries.push(entry);
      return entry;
    };
    await append(buildLifecycleEvent(executionId, 0, "started"), null);
    await append(
      {
        ...buildLifecycleEvent(executionId, 1, "failed"),
        payload: { transition: "failed", failureReason: "payment declined" },
      },
      null,
    );
    const artifact = sealJournal({
      executionId,
      workflowId: parseWorkflowId("support-agent"),
      correlationId: resolveCorrelationId(executionId),
      traceId: createTraceId(),
      entries,
      producedBy: { sdkVersion: "test@0.0.0", journalVersion: "test@0.0.0" },
    });
    const verification = await verifyArtifact(artifact);

    const report = buildExplainabilityReport({ artifact, verification, replay: null });

    expect(report.executionSummary.outcome).toBe("failed");
    expect(report.failure).toEqual({
      failed: true,
      failedAtSequence: 1,
      reason: "payment declined",
    });
  });

  it("pairs tool invocations with their completions in call order", async () => {
    const artifact = await buildScenarioArtifact();
    const verification = await verifyArtifact(artifact);

    const report = buildExplainabilityReport({ artifact, verification, replay: null });

    expect(report.toolExecutionSequence).toHaveLength(1);
    expect(report.toolExecutionSequence[0]).toMatchObject({
      toolName: "knowledge_base_search",
      invokedAtSequence: 1,
      completedAtSequence: 2,
      outcome: "succeeded",
    });
  });

  it("reports a tool invocation with no matching completion as pending", async () => {
    const executionId = testExecutionId();
    const entries: JournalEntry[] = [];
    const first = await appendJournalEntry(
      entries,
      buildLifecycleEvent(executionId, 0, "started"),
      null,
    );
    entries.push(first);
    const second = await appendJournalEntry(entries, buildToolInvokedEvent(executionId, 1), null);
    entries.push(second);
    const artifact = sealJournal({
      executionId,
      workflowId: parseWorkflowId("support-agent"),
      correlationId: resolveCorrelationId(executionId),
      traceId: createTraceId(),
      entries,
      producedBy: { sdkVersion: "test@0.0.0", journalVersion: "test@0.0.0" },
    });
    const verification = await verifyArtifact(artifact);

    const report = buildExplainabilityReport({ artifact, verification, replay: null });

    expect(report.toolExecutionSequence[0]).toMatchObject({
      outcome: "pending",
      completedAtSequence: null,
    });
  });

  it("summarizes the payment lifecycle from requested to completed", async () => {
    const artifact = await buildScenarioArtifact();
    const verification = await verifyArtifact(artifact);

    const report = buildExplainabilityReport({ artifact, verification, replay: null });

    expect(report.paymentLifecycle).toHaveLength(1);
    expect(report.paymentLifecycle[0]).toMatchObject({
      paymentId: "pay_1",
      requestedAtSequence: 4,
      completedAtSequence: 5,
      state: "confirmed",
    });
  });

  it("reflects journal integrity status from the VerificationReport", async () => {
    const artifact = await buildScenarioArtifact();
    const verification = await verifyArtifact(artifact);

    const report = buildExplainabilityReport({ artifact, verification, replay: null });

    expect(report.journalIntegrity).toEqual({
      intact: true,
      checkedAt: verification.checkedAt,
      issueCount: 0,
    });
  });

  it("reflects replay validation status when a ReplaySession is provided", async () => {
    const artifact = await buildScenarioArtifact();
    const verification = await verifyArtifact(artifact);

    const withoutReplay = buildExplainabilityReport({ artifact, verification, replay: null });
    expect(withoutReplay.replayValidation).toEqual({
      replayed: false,
      fidelity: null,
      divergedAt: null,
    });
  });
});
