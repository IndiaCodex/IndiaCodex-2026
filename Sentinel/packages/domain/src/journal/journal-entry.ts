import type { Brand } from "../shared/brand.js";
import { uuidv7 } from "../shared/uuid.js";
import { sha256Hex, type Hash } from "../shared/hash.js";
import type { ExecutionId } from "../identity/execution-id.js";
import type { Event } from "../events/event.js";
import type { Snapshot } from "../snapshot/snapshot.js";
import { requiresSnapshot } from "./invariants.js";

export type JournalEntryId = Brand<string, "JournalEntryId">;

/**
 * One hash-chained record in an Execution Journal: an Event, its
 * Snapshot if any, and a hash covering both plus the previous entry's
 * hash. This is the write-ahead-log-style structure the name
 * "Execution Journal" refers to (ADR-0006) — the hash chain is what
 * makes a sealed Execution Artifact tamper-evident (ADR-0004).
 */
export interface JournalEntry {
  readonly entryId: JournalEntryId;
  readonly executionId: ExecutionId;
  readonly sequence: number;
  readonly event: Event;
  readonly snapshot: Snapshot | null;
  readonly previousEntryHash: Hash | null;
  readonly entryHash: Hash;
}

export class JournalInvariantViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JournalInvariantViolation";
  }
}

/** Thrown when a stored hash chain fails independent re-verification (`verifyJournalChain`). */
export class JournalCorruptionError extends Error {
  constructor(
    public readonly executionId: ExecutionId,
    message: string,
  ) {
    super(message);
    this.name = "JournalCorruptionError";
  }
}

function assertEntryIsValid(
  event: Event,
  snapshot: Snapshot | null,
  expectedSequence: number,
): void {
  if (event.sequence !== expectedSequence) {
    throw new JournalInvariantViolation(
      `Expected event sequence ${expectedSequence}, received ${event.sequence}`,
    );
  }

  const needsSnapshot = requiresSnapshot(event);
  if (needsSnapshot && snapshot === null) {
    throw new JournalInvariantViolation(
      `Event at sequence ${event.sequence} of kind "${event.kind}" requires a Snapshot but none was provided`,
    );
  }
  if (!needsSnapshot && snapshot !== null) {
    throw new JournalInvariantViolation(
      `Event at sequence ${event.sequence} of kind "${event.kind}" must not carry a Snapshot`,
    );
  }
  if (snapshot !== null && snapshot.executionId !== event.executionId) {
    throw new JournalInvariantViolation(
      `Snapshot executionId "${snapshot.executionId}" does not match event executionId "${event.executionId}" at sequence ${event.sequence}`,
    );
  }
}

/**
 * Appends one entry to an Execution's hash chain. Pure and
 * deterministic: given the same prior chain and the same event/snapshot,
 * it always produces the same `entryHash`. Enforces, at the point of
 * write, the two invariants the rest of the platform relies on:
 * contiguous strictly-increasing sequence numbers, and Snapshot
 * presence exactly where ADR-0001 requires it.
 */
export async function appendJournalEntry(
  priorEntries: readonly JournalEntry[],
  event: Event,
  snapshot: Snapshot | null,
): Promise<JournalEntry> {
  const expectedSequence = priorEntries.length;
  assertEntryIsValid(event, snapshot, expectedSequence);

  const previousEntryHash =
    priorEntries.length > 0 ? priorEntries[priorEntries.length - 1]!.entryHash : null;

  const entryHash = await sha256Hex({ previousEntryHash, event, snapshot });

  return {
    entryId: uuidv7() as JournalEntryId,
    executionId: event.executionId,
    sequence: event.sequence,
    event,
    snapshot,
    previousEntryHash,
    entryHash,
  };
}

/**
 * Independently re-verifies a hash chain end-to-end. Used when reading a
 * Journal back from storage, as a defense against partial corruption
 * that write-time validation alone can't catch — e.g. a row edited
 * directly in the database, bypassing `appendJournalEntry` entirely.
 */
export async function verifyJournalChain(entries: readonly JournalEntry[]): Promise<boolean> {
  let previousEntryHash: Hash | null = null;
  for (const entry of entries) {
    if (entry.previousEntryHash !== previousEntryHash) return false;
    const expectedHash = await sha256Hex({
      previousEntryHash,
      event: entry.event,
      snapshot: entry.snapshot,
    });
    if (expectedHash !== entry.entryHash) return false;
    previousEntryHash = entry.entryHash;
  }
  return true;
}
