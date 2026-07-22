import { describe, expect, it } from "vitest";
import {
  SealValidationError,
  appendJournalEntry,
  createTraceId,
  resolveCorrelationId,
  sealJournal,
  parseWorkflowId,
} from "../src/index.js";
import { fixedExecutionId, makeLifecycleEvent, makeToolEventWithSnapshot } from "./fixtures.js";

async function buildTwoEntryChain() {
  const executionId = fixedExecutionId();
  const first = await appendJournalEntry([], makeLifecycleEvent(executionId, 0), null);
  const { event, snapshot } = makeToolEventWithSnapshot(executionId, 1);
  const second = await appendJournalEntry([first], event, snapshot);
  return { executionId, entries: [first, second] };
}

describe("sealJournal", () => {
  it("produces a rootHash equal to the last entry's entryHash", async () => {
    const { executionId, entries } = await buildTwoEntryChain();
    const artifact = sealJournal({
      executionId,
      workflowId: parseWorkflowId("demo-workflow"),
      correlationId: resolveCorrelationId(executionId),
      traceId: createTraceId(),
      entries,
      producedBy: { sdkVersion: "0.1.0", journalVersion: "0.1.0" },
    });

    expect(artifact.rootHash).toBe(entries[1]!.entryHash);
    expect(artifact.timeline).toHaveLength(2);
    expect(artifact.snapshots).toHaveLength(1);
    expect(artifact.signature).toBeNull();
  });

  it("is deterministic given the same entries", async () => {
    const { executionId, entries } = await buildTwoEntryChain();
    const sealedAt = new Date("2026-01-01T00:00:05.000Z");
    const input = {
      executionId,
      workflowId: parseWorkflowId("demo-workflow"),
      correlationId: resolveCorrelationId(executionId),
      traceId: createTraceId(),
      entries,
      producedBy: { sdkVersion: "0.1.0", journalVersion: "0.1.0" },
      sealedAt,
    };
    const a = sealJournal(input);
    const b = sealJournal(input);
    expect(a.rootHash).toBe(b.rootHash);
  });

  it("rejects sealing zero entries", () => {
    expect(() =>
      sealJournal({
        executionId: fixedExecutionId(),
        workflowId: parseWorkflowId("demo-workflow"),
        correlationId: resolveCorrelationId(fixedExecutionId()),
        traceId: createTraceId(),
        entries: [],
        producedBy: { sdkVersion: "0.1.0", journalVersion: "0.1.0" },
      }),
    ).toThrow(SealValidationError);
  });

  it("rejects entries with a sequence gap", async () => {
    const { executionId, entries } = await buildTwoEntryChain();
    const gappy = [entries[0]!, { ...entries[1]!, sequence: 5 }];
    expect(() =>
      sealJournal({
        executionId,
        workflowId: parseWorkflowId("demo-workflow"),
        correlationId: resolveCorrelationId(executionId),
        traceId: createTraceId(),
        entries: gappy,
        producedBy: { sdkVersion: "0.1.0", journalVersion: "0.1.0" },
      }),
    ).toThrow(SealValidationError);
  });

  it("rejects entries belonging to a different execution", async () => {
    const { entries } = await buildTwoEntryChain();
    expect(() =>
      sealJournal({
        executionId: fixedExecutionId(),
        workflowId: parseWorkflowId("demo-workflow"),
        correlationId: resolveCorrelationId(fixedExecutionId()),
        traceId: createTraceId(),
        entries,
        producedBy: { sdkVersion: "0.1.0", journalVersion: "0.1.0" },
      }),
    ).toThrow(SealValidationError);
  });
});
