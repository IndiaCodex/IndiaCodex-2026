import { z } from "zod";

const envelopeShape = {
  executionId: z.string().min(1),
  workflowId: z.string().min(1),
  correlationId: z.string().min(1).optional(),
  traceId: z.string().min(1).optional(),
  sequence: z.number().int().min(0),
  occurredAt: z.iso.datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
};

const decimalAmount = z
  .string()
  .regex(/^\d+(\.\d+)?$/, 'amount must be a non-negative decimal string, e.g. "4.50"');

export const snapshotInputSchema = z.object({
  kind: z.enum(["llm-call", "tool-call", "external-api-call", "clock-read", "random-draw"]),
  request: z.unknown(),
  response: z.unknown(),
  capturedAt: z.iso.datetime().optional(),
});

const lifecyclePayloadSchema = z.object({
  transition: z.enum(["started", "retried", "completed", "failed"]),
  retriesExecutionId: z.string().min(1).optional(),
  failureReason: z.string().min(1).optional(),
});

const decisionPayloadSchema = z.object({
  summary: z.string().min(1),
  rationale: z.string().min(1).optional(),
  inputRefs: z.array(z.number().int().min(0)),
});

const toolPayloadSchema = z.discriminatedUnion("phase", [
  z.object({
    phase: z.literal("invoked"),
    toolName: z.string().min(1),
    arguments: z.unknown(),
  }),
  z.object({
    phase: z.literal("completed"),
    toolName: z.string().min(1),
    arguments: z.unknown(),
    result: z.unknown(),
    error: z.string().min(1).optional(),
  }),
]);

const paymentPayloadSchema = z.discriminatedUnion("phase", [
  z.object({
    phase: z.literal("requested"),
    paymentId: z.string().min(1),
    amount: decimalAmount,
    currency: z.string().min(1),
    masumiReference: z.string().min(1).optional(),
  }),
  z.object({
    phase: z.literal("completed"),
    paymentId: z.string().min(1),
    amount: decimalAmount,
    currency: z.string().min(1),
    state: z.enum(["confirmed", "failed"]),
    masumiReference: z.string().min(1).optional(),
  }),
]);

/**
 * Validates a raw (e.g. JSON-parsed HTTP body) value against the
 * `CaptureEventCommand` shape (`./commands.ts`). Structural only — the
 * cross-cutting business rule of which `tool`/`payment` phases require
 * a Snapshot is enforced by the domain, not here (see `commands.ts`).
 */
export const captureEventCommandSchema = z.discriminatedUnion("kind", [
  z.object({ ...envelopeShape, kind: z.literal("lifecycle"), payload: lifecyclePayloadSchema }),
  z.object({
    ...envelopeShape,
    kind: z.literal("decision"),
    payload: decisionPayloadSchema,
    snapshot: snapshotInputSchema,
  }),
  z.object({
    ...envelopeShape,
    kind: z.literal("tool"),
    payload: toolPayloadSchema,
    snapshot: snapshotInputSchema.optional(),
  }),
  z.object({
    ...envelopeShape,
    kind: z.literal("payment"),
    payload: paymentPayloadSchema,
    snapshot: snapshotInputSchema.optional(),
  }),
]);
