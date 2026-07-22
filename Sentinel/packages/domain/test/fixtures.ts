import {
  appendJournalEntry,
  createEventId,
  createExecutionId,
  createSnapshotId,
  createTraceId,
  parseWorkflowId,
  resolveCorrelationId,
  sealJournal,
  type DecisionEvent,
  type ExecutionArtifact,
  type ExecutionId,
  type JournalEntry,
  type LifecycleEvent,
  type Snapshot,
  type ToolEvent,
} from "../src/index.js";

export function fixedExecutionId(): ExecutionId {
  return createExecutionId(new Date("2026-01-01T00:00:00.000Z"));
}

export function makeLifecycleEvent(
  executionId: ExecutionId,
  sequence: number,
  transition: "started" | "completed" | "failed" = "started",
): LifecycleEvent {
  return {
    eventId: createEventId(),
    executionId,
    sequence,
    occurredAt: new Date("2026-01-01T00:00:00.000Z"),
    kind: "lifecycle",
    payload: { transition },
    snapshotRef: null,
    metadata: {},
  };
}

export function makeToolInvokedEvent(executionId: ExecutionId, sequence: number): ToolEvent {
  return {
    eventId: createEventId(),
    executionId,
    sequence,
    occurredAt: new Date("2026-01-01T00:00:01.000Z"),
    kind: "tool",
    payload: {
      phase: "invoked",
      toolName: "http_get",
      arguments: { url: "https://example.test" },
    },
    snapshotRef: null,
    metadata: {},
  };
}

export function makeToolEventWithSnapshot(
  executionId: ExecutionId,
  sequence: number,
): { event: ToolEvent; snapshot: Snapshot } {
  const snapshot: Snapshot = {
    snapshotId: createSnapshotId(),
    executionId,
    kind: "tool-call",
    request: { toolName: "http_get", url: "https://example.test" },
    response: { status: 200, body: "ok" },
    capturedAt: new Date("2026-01-01T00:00:01.000Z"),
  };
  const event: ToolEvent = {
    eventId: createEventId(),
    executionId,
    sequence,
    occurredAt: new Date("2026-01-01T00:00:01.000Z"),
    kind: "tool",
    payload: {
      phase: "completed",
      toolName: "http_get",
      arguments: { url: "https://example.test" },
      result: { status: 200 },
    },
    snapshotRef: snapshot.snapshotId,
    metadata: {},
  };
  return { event, snapshot };
}

export function makeDecisionEventWithSnapshot(
  executionId: ExecutionId,
  sequence: number,
): { event: DecisionEvent; snapshot: Snapshot } {
  const snapshot: Snapshot = {
    snapshotId: createSnapshotId(),
    executionId,
    kind: "llm-call",
    request: { prompt: "should we proceed?" },
    response: { text: "yes" },
    capturedAt: new Date("2026-01-01T00:00:02.000Z"),
  };
  const event: DecisionEvent = {
    eventId: createEventId(),
    executionId,
    sequence,
    occurredAt: new Date("2026-01-01T00:00:02.000Z"),
    kind: "decision",
    payload: { summary: "proceed", inputRefs: [sequence - 1] },
    snapshotRef: snapshot.snapshotId,
    metadata: {},
  };
  return { event, snapshot };
}

/**
 * A realistic multi-event chain (started -> tool invoked -> tool
 * completed -> decision -> completed), sealed into a real
 * ExecutionArtifact via the real `appendJournalEntry`/`sealJournal`
 * pipeline — used across the Step 3.3 verify/replay/export test suites
 * so they exercise production code paths, not hand-built fixtures.
 */
export async function buildSampleArtifact(
  executionId: ExecutionId = fixedExecutionId(),
): Promise<{ artifact: ExecutionArtifact; entries: JournalEntry[] }> {
  const entries: JournalEntry[] = [];
  const append = async (
    event: Parameters<typeof appendJournalEntry>[1],
    snapshot: Snapshot | null,
  ) => {
    const entry = await appendJournalEntry(entries, event, snapshot);
    entries.push(entry);
    return entry;
  };

  await append(makeLifecycleEvent(executionId, 0, "started"), null);
  await append(makeToolInvokedEvent(executionId, 1), null);
  const { event: toolCompleted, snapshot: toolSnapshot } = makeToolEventWithSnapshot(
    executionId,
    2,
  );
  await append(toolCompleted, toolSnapshot);
  const { event: decision, snapshot: decisionSnapshot } = makeDecisionEventWithSnapshot(
    executionId,
    3,
  );
  await append(decision, decisionSnapshot);
  await append(makeLifecycleEvent(executionId, 4, "completed"), null);

  const artifact = sealJournal({
    executionId,
    workflowId: parseWorkflowId("sample-workflow"),
    correlationId: resolveCorrelationId(executionId),
    traceId: createTraceId(),
    entries,
    producedBy: { sdkVersion: "test@0.0.0", journalVersion: "test@0.0.0" },
  });

  return { artifact, entries };
}
