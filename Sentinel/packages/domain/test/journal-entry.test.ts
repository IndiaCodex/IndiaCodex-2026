import { describe, expect, it } from "vitest";
import {
  JournalInvariantViolation,
  appendJournalEntry,
  verifyJournalChain,
  type JournalEntry,
} from "../src/index.js";
import {
  fixedExecutionId,
  makeLifecycleEvent,
  makeToolEventWithSnapshot,
  makeToolInvokedEvent,
} from "./fixtures.js";

describe("appendJournalEntry", () => {
  it("chains entries so each hash depends on the previous one", async () => {
    const executionId = fixedExecutionId();
    const first = await appendJournalEntry([], makeLifecycleEvent(executionId, 0), null);
    const { event, snapshot } = makeToolEventWithSnapshot(executionId, 1);
    const second = await appendJournalEntry([first], event, snapshot);

    expect(first.previousEntryHash).toBeNull();
    expect(second.previousEntryHash).toBe(first.entryHash);
    expect(second.entryHash).not.toBe(first.entryHash);
  });

  it("is deterministic: replaying the same append produces the same hash", async () => {
    const executionId = fixedExecutionId();
    const event = makeLifecycleEvent(executionId, 0);
    const a = await appendJournalEntry([], event, null);
    const b = await appendJournalEntry([], event, null);
    expect(a.entryHash).toBe(b.entryHash);
  });

  it("rejects an out-of-order sequence number", async () => {
    const executionId = fixedExecutionId();
    await expect(appendJournalEntry([], makeLifecycleEvent(executionId, 5), null)).rejects.toThrow(
      JournalInvariantViolation,
    );
  });

  it("accepts a tool 'invoked' event with no Snapshot (in-flight call)", async () => {
    const executionId = fixedExecutionId();
    const entry = await appendJournalEntry([], makeToolInvokedEvent(executionId, 0), null);
    expect(entry.snapshot).toBeNull();
  });

  it("rejects a tool 'invoked' event that carries a Snapshot", async () => {
    const executionId = fixedExecutionId();
    const { snapshot } = makeToolEventWithSnapshot(executionId, 0);
    await expect(
      appendJournalEntry([], makeToolInvokedEvent(executionId, 0), snapshot),
    ).rejects.toThrow(/must not carry a Snapshot/);
  });

  it("rejects a tool 'completed' event with no Snapshot", async () => {
    const executionId = fixedExecutionId();
    const { event } = makeToolEventWithSnapshot(executionId, 0);
    await expect(appendJournalEntry([], event, null)).rejects.toThrow(
      /requires a Snapshot but none was provided/,
    );
  });

  it("rejects a lifecycle event carrying a Snapshot", async () => {
    const executionId = fixedExecutionId();
    const { snapshot } = makeToolEventWithSnapshot(executionId, 0);
    await expect(
      appendJournalEntry([], makeLifecycleEvent(executionId, 0), snapshot),
    ).rejects.toThrow(/must not carry a Snapshot/);
  });

  it("rejects a Snapshot whose executionId does not match the event's", async () => {
    const executionId = fixedExecutionId();
    const otherExecutionId = fixedExecutionId();
    const { event, snapshot } = makeToolEventWithSnapshot(executionId, 0);
    await expect(
      appendJournalEntry([], event, { ...snapshot, executionId: otherExecutionId }),
    ).rejects.toThrow(/does not match event executionId/);
  });
});

describe("verifyJournalChain", () => {
  it("accepts an untampered chain", async () => {
    const executionId = fixedExecutionId();
    const first = await appendJournalEntry([], makeLifecycleEvent(executionId, 0), null);
    const { event, snapshot } = makeToolEventWithSnapshot(executionId, 1);
    const second = await appendJournalEntry([first], event, snapshot);

    expect(await verifyJournalChain([first, second])).toBe(true);
  });

  it("rejects a chain with a tampered entryHash", async () => {
    const executionId = fixedExecutionId();
    const first = await appendJournalEntry([], makeLifecycleEvent(executionId, 0), null);
    const lastChar = first.entryHash.slice(-1);
    const flippedChar = lastChar === "0" ? "1" : "0"; // guaranteed different, regardless of the real digest
    const tampered: JournalEntry = {
      ...first,
      entryHash: `${first.entryHash.slice(0, -1)}${flippedChar}` as typeof first.entryHash,
    };

    expect(await verifyJournalChain([tampered])).toBe(false);
  });

  it("rejects a chain with a tampered payload whose stored hash wasn't updated", async () => {
    const executionId = fixedExecutionId();
    const first = await appendJournalEntry([], makeLifecycleEvent(executionId, 0), null);
    const tamperedEvent = {
      ...first.event,
      payload: { transition: "failed" as const, failureReason: "injected" },
    } as typeof first.event;
    const tampered: JournalEntry = { ...first, event: tamperedEvent };

    expect(await verifyJournalChain([tampered])).toBe(false);
  });
});
