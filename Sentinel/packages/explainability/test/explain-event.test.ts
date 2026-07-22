import { describe, expect, it } from "vitest";
import { explainEvent } from "../src/explain-event.js";
import {
  buildDecisionEvent,
  buildLifecycleEvent,
  buildPaymentCompletedEvent,
  buildPaymentRequestedEvent,
  buildToolCompletedEvent,
  buildToolInvokedEvent,
  testExecutionId,
} from "@sentinel/testkit";

describe("explainEvent", () => {
  const executionId = testExecutionId();

  it("explains lifecycle events deterministically per transition", () => {
    expect(explainEvent(buildLifecycleEvent(executionId, 0, "started")).text).toBe(
      "Execution started.",
    );
    expect(explainEvent(buildLifecycleEvent(executionId, 0, "completed")).text).toBe(
      "Execution completed successfully.",
    );
  });

  it("includes the failure reason when present", () => {
    const event = buildLifecycleEvent(executionId, 0, "failed");
    const withReason = {
      ...event,
      payload: { transition: "failed" as const, failureReason: "timeout" },
    };
    expect(explainEvent(withReason).text).toBe("Execution failed: timeout");
    expect(explainEvent(event).text).toBe("Execution failed.");
  });

  it("explains a tool invocation without claiming a result", () => {
    const explanation = explainEvent(buildToolInvokedEvent(executionId, 1));
    expect(explanation.text).toBe('Tool "knowledge_base_search" invoked.');
  });

  it("explains a successful tool completion", () => {
    const { event } = buildToolCompletedEvent(executionId, 2);
    expect(explainEvent(event).text).toBe('Tool "knowledge_base_search" completed successfully.');
  });

  it("explains a failed tool completion with its error", () => {
    const { event } = buildToolCompletedEvent(executionId, 2, { error: "connection refused" });
    expect(explainEvent(event).text).toBe(
      'Tool "knowledge_base_search" failed: connection refused',
    );
  });

  it("cites the input events a decision was based on", () => {
    const { event } = buildDecisionEvent(executionId, 3, { inputRefs: [1, 2] });
    const explanation = explainEvent(event);
    expect(explanation.citedEvents).toEqual([1, 2]);
    expect(explanation.text).toContain("Decision recorded");
  });

  it("explains a payment request", () => {
    const event = buildPaymentRequestedEvent(executionId, 4, {
      paymentId: "pay_1",
      amount: "4.50",
      currency: "ADA",
    });
    expect(explainEvent(event).text).toBe('Payment "pay_1" requested for 4.50 ADA.');
  });

  it("explains a completed payment with its Masumi reference", () => {
    const { event } = buildPaymentCompletedEvent(executionId, 5, {
      paymentId: "pay_1",
      state: "confirmed",
      masumiReference: "masumi_tx_abc",
    });
    expect(explainEvent(event).text).toBe('Payment "pay_1" confirmed (reference "masumi_tx_abc").');
  });

  it("is deterministic: the same event always produces the same explanation", () => {
    const event = buildLifecycleEvent(executionId, 0, "started");
    expect(explainEvent(event)).toEqual(explainEvent(event));
  });
});
