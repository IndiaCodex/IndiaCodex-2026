import type { Brand } from "../shared/brand.js";
import { randomHex } from "../shared/random.js";

/**
 * A W3C Trace Context trace-id (128-bit, 32 hex chars) — adopted
 * deliberately instead of a Sentinel-specific scheme, so an Execution's
 * Timeline correlates for free with the caller's existing distributed
 * tracing (e.g. OpenTelemetry) rather than requiring manual stitching.
 * See ADR-0005.
 */
export type TraceId = Brand<string, "TraceId">;

const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;
const ALL_ZERO_TRACE_ID = "0".repeat(32);

// https://www.w3.org/TR/trace-context/#traceparent-header-field-values
const TRACEPARENT_PATTERN = /^[0-9a-f]{2}-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$/;

export function createTraceId(): TraceId {
  return randomHex(16) as TraceId;
}

export function isTraceId(value: string): value is TraceId {
  return TRACE_ID_PATTERN.test(value) && value !== ALL_ZERO_TRACE_ID;
}

/**
 * Adopts the trace-id from an incoming W3C `traceparent` header. Returns
 * null if the header is absent, malformed, or carries the reserved
 * all-zero trace-id, in which case the caller should fall back to
 * `createTraceId()`.
 */
export function parseTraceParent(header: string | undefined | null): TraceId | null {
  if (!header) return null;
  const match = TRACEPARENT_PATTERN.exec(header.trim());
  if (!match) return null;
  const traceId = match[1]!;
  if (traceId === ALL_ZERO_TRACE_ID) return null;
  return traceId as TraceId;
}
