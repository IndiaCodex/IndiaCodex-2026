import { describe, expect, it } from "vitest";
import { createEventId, createExecutionId, requiresSnapshot, type Event } from "../src/index.js";

const executionId = createExecutionId(new Date("2026-01-01T00:00:00.000Z"));

function envelope<Kind extends Event["kind"], Payload>(kind: Kind, payload: Payload): Event {
  return {
    eventId: createEventId(),
    executionId,
    sequence: 0,
    occurredAt: new Date("2026-01-01T00:00:00.000Z"),
    kind,
    payload,
    snapshotRef: null,
    metadata: {},
  } as Event;
}

/**
 * `requiresSnapshot` is the function `appendJournalEntry` relies on to
 * enforce ADR-0001's core invariant — every event that wraps a
 * nondeterministic boundary must carry a Snapshot, and every event that
 * doesn't must not. Tested directly (not just indirectly through
 * `journal-entry.test.ts`) because it's a 4-way branch over event
 * kind/phase, and each branch is a distinct, independently reachable
 * rule worth pinning down on its own.
 */
describe("requiresSnapshot", () => {
  it("never requires a Snapshot for a lifecycle event", () => {
    expect(requiresSnapshot(envelope("lifecycle", { transition: "started" }))).toBe(false);
  });

  it("always requires a Snapshot for a decision event", () => {
    expect(requiresSnapshot(envelope("decision", { summary: "x", inputRefs: [] }))).toBe(true);
  });

  it("does not require a Snapshot for a tool 'invoked' event", () => {
    const event = envelope("tool", { phase: "invoked", toolName: "x", arguments: {} });
    expect(requiresSnapshot(event)).toBe(false);
  });

  it("requires a Snapshot for a tool 'completed' event", () => {
    const event = envelope("tool", {
      phase: "completed",
      toolName: "x",
      arguments: {},
      result: {},
    });
    expect(requiresSnapshot(event)).toBe(true);
  });

  it("does not require a Snapshot for a payment 'requested' event", () => {
    const event = envelope("payment", {
      phase: "requested",
      paymentId: "pay_1",
      amount: "1.00",
      currency: "ADA",
    });
    expect(requiresSnapshot(event)).toBe(false);
  });

  it("requires a Snapshot for a payment 'completed' event", () => {
    const event = envelope("payment", {
      phase: "completed",
      paymentId: "pay_1",
      amount: "1.00",
      currency: "ADA",
      state: "confirmed",
    });
    expect(requiresSnapshot(event)).toBe(true);
  });
});
