import { describe, expect, it } from "vitest";
import {
  createExecutionId,
  createTraceId,
  isExecutionId,
  isTraceId,
  isWorkflowId,
  parseTraceParent,
  parseWorkflowId,
  resolveCorrelationId,
} from "../src/index.js";

describe("ExecutionId", () => {
  it("generates a UUIDv7-shaped identifier", () => {
    const id = createExecutionId();
    expect(isExecutionId(id)).toBe(true);
    expect(id.charAt(14)).toBe("7"); // version nibble
  });

  it("orders lexicographically by creation time", () => {
    const earlier = createExecutionId(new Date("2026-01-01T00:00:00.000Z"));
    const later = createExecutionId(new Date("2026-01-01T00:00:01.000Z"));
    expect(earlier < later).toBe(true);
  });
});

describe("WorkflowId", () => {
  it("accepts a lowercase slug", () => {
    expect(isWorkflowId("invoice-approval-agent")).toBe(true);
    expect(parseWorkflowId("invoice-approval-agent")).toBe("invoice-approval-agent");
  });

  it.each(["Invoice-Approval", "invoice_approval", "-leading-hyphen", ""])(
    "rejects %j",
    (value) => {
      expect(isWorkflowId(value)).toBe(false);
    },
  );
});

describe("CorrelationId", () => {
  it("defaults to the ExecutionId when nothing is supplied", () => {
    const executionId = createExecutionId();
    expect(resolveCorrelationId(executionId)).toBe(executionId);
  });

  it("uses the caller-supplied value when present", () => {
    const executionId = createExecutionId();
    expect(resolveCorrelationId(executionId, "biz-op-42")).toBe("biz-op-42");
  });
});

describe("TraceId", () => {
  it("generates a 32-character hex trace id", () => {
    const traceId = createTraceId();
    expect(isTraceId(traceId)).toBe(true);
    expect(traceId).toHaveLength(32);
  });

  it("adopts the trace-id from a valid traceparent header", () => {
    const header = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
    expect(parseTraceParent(header)).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
  });

  it("rejects a malformed traceparent header", () => {
    expect(parseTraceParent("not-a-traceparent")).toBeNull();
  });

  it("rejects the reserved all-zero trace-id", () => {
    const header = "00-00000000000000000000000000000000-00f067aa0ba902b7-01";
    expect(parseTraceParent(header)).toBeNull();
  });

  it("returns null when no header is supplied", () => {
    expect(parseTraceParent(undefined)).toBeNull();
    expect(parseTraceParent(null)).toBeNull();
  });
});
