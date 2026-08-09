import {
  createEventId,
  createSnapshotId,
  createTraceId,
  isTerminalStatus,
  JournalInvariantViolation,
  parseExecutionId,
  parseWorkflowId,
  resolveCorrelationId,
  type DecisionPayload,
  type Event,
  type Execution,
  type ExecutionArtifact,
  type ExecutionJournalPort,
  type JournalEntry,
  type LifecyclePayload,
  type MasumiAdapterPort,
  type PaymentPayload,
  type Snapshot,
  type StoragePort,
  type ToolPayload,
  type TraceId,
} from "@sentinel/domain";
import type { CaptureEventCommand } from "./commands.js";
import { deriveStatus } from "./derive-status.js";
import { EventCaptureError } from "./errors.js";
import { captureEventCommandSchema } from "./schemas.js";

export interface CaptureEventResult {
  readonly entry: JournalEntry;
  readonly execution: Execution;
  /** Non-null exactly when this Event brought the Execution to a terminal status (ADR-0006 auto-sealing). */
  readonly sealedArtifact: ExecutionArtifact | null;
}

/**
 * The Execution Capture pipeline (Step 3.2): validates an incoming
 * event, appends it to the Execution Journal, updates the Execution
 * read model, and — when the event is a terminal lifecycle transition —
 * automatically seals the Journal into an Execution Artifact.
 *
 * A `payment` event is additionally routed through `MasumiAdapterPort`
 * (`resolvePaymentPayload`) before it's written to the Journal — this is
 * Sentinel's one live touchpoint with Masumi during the capture path
 * itself, not just at export time. Per the port's contract, a rejected
 * enrichment call degrades to "captured data alone," never to a failed
 * capture: what the agent directly observed must always be recordable
 * even if Masumi is unreachable.
 *
 * Every rejection is a thrown `EventCaptureError` with a stable `reason`
 * code, so callers get deterministic, typed validation errors rather
 * than ad hoc messages.
 */
export class CaptureEventUseCase {
  constructor(
    private readonly storage: StoragePort,
    private readonly journal: ExecutionJournalPort,
    private readonly masumiAdapter: MasumiAdapterPort,
  ) {}

  async execute(rawCommand: unknown): Promise<CaptureEventResult> {
    const command = this.parseCommand(rawCommand);
    const executionId = this.parseExecutionIdOrReject(command.executionId);
    const workflowId = parseWorkflowId(command.workflowId); // already envelope-validated by schema; malformed slug is a genuine reject
    const existingExecution = await this.storage.getExecution(executionId);

    if (!existingExecution && !isFirstEvent(command)) {
      throw new EventCaptureError(
        "UNKNOWN_EXECUTION",
        `Execution "${executionId}" has not started; the first Event for an Execution must be a lifecycle "started" event`,
      );
    }

    if (existingExecution && isTerminalStatus(existingExecution.status)) {
      throw new EventCaptureError(
        "EXECUTION_ALREADY_TERMINAL",
        `Execution "${executionId}" already reached a terminal status ("${existingExecution.status}") and cannot accept further Events`,
      );
    }

    if (existingExecution && existingExecution.workflowId !== workflowId) {
      throw new EventCaptureError(
        "IDENTITY_MISMATCH",
        `Event declares workflowId "${workflowId}" but Execution "${executionId}" was started with workflowId "${existingExecution.workflowId}"`,
      );
    }

    const traceId = this.resolveTraceId(command, existingExecution);
    const correlationId = existingExecution
      ? this.resolveExistingCorrelationId(command, existingExecution)
      : resolveCorrelationId(executionId, command.correlationId);

    const occurredAt = command.occurredAt ? new Date(command.occurredAt) : new Date();
    const snapshot = this.buildSnapshot(command, executionId, occurredAt);
    const event = await this.buildEvent(command, executionId, occurredAt, snapshot);

    const entry = await this.appendOrReject(event, snapshot);

    const status = deriveStatus(event);
    const execution: Execution = {
      executionId,
      workflowId,
      correlationId,
      traceId,
      status,
      startedAt: existingExecution?.startedAt ?? occurredAt,
      endedAt: isTerminalStatus(status) ? occurredAt : null,
      timeline: [...(existingExecution?.timeline ?? []), event],
    };
    await this.storage.saveExecution(execution);

    const sealedArtifact = isTerminalStatus(status) ? await this.journal.seal(executionId) : null;

    return { entry, execution, sealedArtifact };
  }

  private parseCommand(rawCommand: unknown): CaptureEventCommand {
    const result = captureEventCommandSchema.safeParse(rawCommand);
    if (!result.success) {
      throw new EventCaptureError(
        "INVALID_ENVELOPE",
        "Event failed schema validation",
        result.error.flatten(),
      );
    }
    return result.data;
  }

  private parseExecutionIdOrReject(raw: string) {
    try {
      return parseExecutionId(raw);
    } catch {
      throw new EventCaptureError("INVALID_ENVELOPE", `Invalid executionId "${raw}"`);
    }
  }

  private resolveTraceId(
    command: CaptureEventCommand,
    existingExecution: Execution | null,
  ): TraceId {
    if (!command.traceId) {
      return existingExecution?.traceId ?? createTraceId();
    }
    if (existingExecution && command.traceId !== existingExecution.traceId) {
      throw new EventCaptureError(
        "IDENTITY_MISMATCH",
        `Event declares traceId "${command.traceId}" but Execution "${existingExecution.executionId}" was started with traceId "${existingExecution.traceId}"`,
      );
    }
    return command.traceId as TraceId;
  }

  private resolveExistingCorrelationId(command: CaptureEventCommand, existingExecution: Execution) {
    if (command.correlationId && command.correlationId !== existingExecution.correlationId) {
      throw new EventCaptureError(
        "IDENTITY_MISMATCH",
        `Event declares correlationId "${command.correlationId}" but Execution "${existingExecution.executionId}" was started with correlationId "${existingExecution.correlationId}"`,
      );
    }
    return existingExecution.correlationId;
  }

  private buildSnapshot(
    command: CaptureEventCommand,
    executionId: Event["executionId"],
    occurredAt: Date,
  ): Snapshot | null {
    const input = command.kind === "lifecycle" ? undefined : command.snapshot;
    if (!input) return null;
    return {
      snapshotId: createSnapshotId(),
      executionId,
      kind: input.kind,
      request: input.request,
      response: input.response,
      capturedAt: input.capturedAt ? new Date(input.capturedAt) : occurredAt,
    };
  }

  private async buildEvent(
    command: CaptureEventCommand,
    executionId: Event["executionId"],
    occurredAt: Date,
    snapshot: Snapshot | null,
  ): Promise<Event> {
    const envelope = {
      eventId: createEventId(),
      executionId,
      sequence: command.sequence,
      occurredAt,
      snapshotRef: snapshot?.snapshotId ?? null,
      metadata: command.metadata ?? {},
    };

    // zod infers optional fields as `T | undefined`, while the domain
    // payload types use `exactOptionalPropertyTypes`-strict `field?: T`
    // (the key must be entirely absent, never present-with-`undefined`).
    // Verified zod omits the key at runtime when input doesn't supply
    // it, so these payloads are runtime-compatible; the cast below
    // exists only to bridge that type-inference gap, not to bypass a
    // real safety check.
    switch (command.kind) {
      case "lifecycle":
        return { ...envelope, kind: "lifecycle", payload: command.payload as LifecyclePayload };
      case "decision":
        return { ...envelope, kind: "decision", payload: command.payload as DecisionPayload };
      case "tool":
        return { ...envelope, kind: "tool", payload: command.payload as ToolPayload };
      case "payment": {
        const payload = await this.resolvePaymentPayload(command.payload as PaymentPayload);
        return { ...envelope, kind: "payment", payload };
      }
    }
  }

  /**
   * Routes a Payment event through `MasumiAdapterPort` before it's
   * written to the Journal. `MockMasumiAdapter` (the production default)
   * fills `masumiReference` from Masumi's payment settlement outcome; a
   * real Masumi client is a drop-in replacement behind the same port. A
   * rejected enrichment call is treated as "no enrichment available,"
   * per the port's contract — the payment is still captured exactly as
   * the agent reported it, never blocked on Masumi being reachable.
   */
  private async resolvePaymentPayload(payload: PaymentPayload): Promise<PaymentPayload> {
    try {
      return await this.masumiAdapter.enrichPayment(payload);
    } catch {
      return payload;
    }
  }

  private async appendOrReject(event: Event, snapshot: Snapshot | null): Promise<JournalEntry> {
    try {
      return await this.journal.append(event, snapshot);
    } catch (error) {
      if (error instanceof JournalInvariantViolation) {
        throw new EventCaptureError("JOURNAL_INVARIANT_VIOLATION", error.message);
      }
      throw error;
    }
  }
}

function isFirstEvent(command: CaptureEventCommand): boolean {
  return command.kind === "lifecycle" && command.payload.transition === "started";
}
