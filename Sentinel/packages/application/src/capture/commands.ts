import type { z } from "zod";
import type { captureEventCommandSchema, snapshotInputSchema } from "./schemas.js";

/**
 * The captured request/response of one nondeterministic call, as
 * supplied by the caller (SDK or HTTP body). The use case derives
 * `snapshotId`/`executionId` — those aren't the caller's to set.
 */
export type SnapshotInput = z.infer<typeof snapshotInputSchema>;

/**
 * The Execution Capture pipeline's input: everything the user's Step
 * 3.2 requirements call for (identity fields, sequence number, optional
 * Snapshot, metadata) plus a `kind`-specific payload covering all eight
 * supported event types — Execution Started/Completed/Failed and
 * Retried (`lifecycle`), Tool Invoked/Completed (`tool`), Payment
 * Requested/Completed (`payment`), and Decision Recorded (`decision`).
 *
 * Inferred from `captureEventCommandSchema` rather than hand-written, so
 * the compile-time type and the runtime validator can never drift apart.
 *
 * Whether `snapshot` is actually required for a given `tool`/`payment`
 * command depends on `payload.phase` ("invoked"/"requested" vs.
 * "completed") — that invariant is enforced once, authoritatively, by
 * the domain (`requiresSnapshot`/`appendJournalEntry`, ADR-0001) rather
 * than re-encoded here, so it can't drift between two implementations.
 */
export type CaptureEventCommand = z.infer<typeof captureEventCommandSchema>;
