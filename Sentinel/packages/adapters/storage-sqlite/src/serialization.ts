import type { Event, Execution, ExecutionArtifact, JournalEntry, Snapshot } from "@sentinel/domain";

/**
 * `JSON.stringify` already turns `Date` into an ISO string, so writing
 * is free; reading back requires re-hydrating those fields, since
 * `JSON.parse` leaves them as strings. Centralized here so every read
 * path restores dates the same way instead of each query site guessing.
 */

/** `JSON.parse` typed as `unknown` rather than `any`, so callers can't accidentally treat the result as pre-validated. */
export function parseJson(text: string): unknown {
  return JSON.parse(text) as unknown;
}

export function reviveEvent(raw: unknown): Event {
  const value = raw as Event & { occurredAt: string };
  return { ...value, occurredAt: new Date(value.occurredAt) };
}

export function reviveSnapshot(raw: unknown): Snapshot {
  const value = raw as Snapshot & { capturedAt: string };
  return { ...value, capturedAt: new Date(value.capturedAt) };
}

export function reviveJournalEntryContents(
  event: unknown,
  snapshot: unknown,
): Pick<JournalEntry, "event" | "snapshot"> {
  return {
    event: reviveEvent(event),
    snapshot: snapshot === null || snapshot === undefined ? null : reviveSnapshot(snapshot),
  };
}

export function reviveExecution(raw: unknown): Execution {
  const value = raw as Execution & {
    startedAt: string;
    endedAt: string | null;
    timeline: unknown[];
  };
  return {
    ...value,
    startedAt: new Date(value.startedAt),
    endedAt: value.endedAt === null ? null : new Date(value.endedAt),
    timeline: value.timeline.map((event) => reviveEvent(event)),
  };
}

export function reviveArtifact(raw: unknown): ExecutionArtifact {
  const value = raw as ExecutionArtifact & {
    sealedAt: string;
    timeline: unknown[];
    snapshots: unknown[];
  };
  return {
    ...value,
    sealedAt: new Date(value.sealedAt),
    timeline: value.timeline.map((event) => reviveEvent(event)),
    snapshots: value.snapshots.map((snapshot) => reviveSnapshot(snapshot)),
  };
}
