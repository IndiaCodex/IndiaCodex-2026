import { describe, expect, it } from "vitest";
import {
  EXECUTION_AUDIT_EXPORT_SCHEMA_VERSION,
  assembleExecutionAuditExport,
  replayArtifact,
  verifyArtifact,
  type EngineeringExplainabilityReport,
  type ExecutionArtifact,
} from "../src/index.js";
import { buildSampleArtifact } from "./fixtures.js";

// Minimal stand-in shaped like a real report; @sentinel/explainability
// covers full generation-logic testing separately — this test suite
// only needs *a* valid report to exercise bundle assembly.
function buildSampleExplainability(artifact: ExecutionArtifact): EngineeringExplainabilityReport {
  return {
    executionSummary: {
      executionId: artifact.executionId,
      workflowId: artifact.workflowId,
      correlationId: artifact.correlationId,
      traceId: artifact.traceId,
      startedAt: artifact.timeline[0]?.occurredAt ?? artifact.sealedAt,
      endedAt: artifact.sealedAt,
      durationMs: 0,
      eventCount: artifact.timeline.length,
      toolInvocationCount: 0,
      decisionCount: 0,
      paymentCount: 0,
      outcome: "completed",
    },
    timelineSummary: [],
    failure: { failed: false, failedAtSequence: null, reason: null },
    toolExecutionSequence: [],
    paymentLifecycle: [],
    journalIntegrity: { intact: true, checkedAt: new Date(), issueCount: 0 },
    replayValidation: { replayed: true, fidelity: "identical", divergedAt: null },
    generatedAt: new Date(),
  };
}

describe("assembleExecutionAuditExport", () => {
  it("bundles the artifact, hash chain, verification, replay, and explainability", async () => {
    const { artifact } = await buildSampleArtifact();
    const verification = await verifyArtifact(artifact);
    const replay = await replayArtifact(artifact);
    const explainability = buildSampleExplainability(artifact);

    const bundle = await assembleExecutionAuditExport({
      artifact,
      verification,
      replay,
      explainability,
    });

    expect(bundle.exportSchemaVersion).toBe(EXECUTION_AUDIT_EXPORT_SCHEMA_VERSION);
    expect(bundle.artifact).toBe(artifact);
    expect(bundle.verification).toBe(verification);
    expect(bundle.replay).toBe(replay);
    expect(bundle.hashChain).toHaveLength(artifact.timeline.length);
    expect(bundle.hashChain[bundle.hashChain.length - 1]?.entryHash).toBe(artifact.rootHash);
    expect(bundle.exportedAt).toBeInstanceOf(Date);
  });

  it("allows a null replay (export without having replayed first)", async () => {
    const { artifact } = await buildSampleArtifact();
    const verification = await verifyArtifact(artifact);
    const explainability = buildSampleExplainability(artifact);

    const bundle = await assembleExecutionAuditExport({
      artifact,
      verification,
      replay: null,
      explainability,
    });

    expect(bundle.replay).toBeNull();
  });

  it("is deterministic given an explicit exportedAt", async () => {
    const { artifact } = await buildSampleArtifact();
    const verification = await verifyArtifact(artifact);
    const explainability = buildSampleExplainability(artifact);
    const exportedAt = new Date("2026-02-01T00:00:00.000Z");

    const a = await assembleExecutionAuditExport({
      artifact,
      verification,
      replay: null,
      explainability,
      exportedAt,
    });
    const b = await assembleExecutionAuditExport({
      artifact,
      verification,
      replay: null,
      explainability,
      exportedAt,
    });

    expect(a.hashChain).toEqual(b.hashChain);
    expect(a.exportedAt).toEqual(b.exportedAt);
  });

  it("survives JSON round-tripping (portability)", async () => {
    const { artifact } = await buildSampleArtifact();
    const verification = await verifyArtifact(artifact);
    const explainability = buildSampleExplainability(artifact);

    const bundle = await assembleExecutionAuditExport({
      artifact,
      verification,
      replay: null,
      explainability,
    });
    const roundTripped = JSON.parse(JSON.stringify(bundle)) as typeof bundle;

    expect(roundTripped.artifact.rootHash).toBe(bundle.artifact.rootHash);
    expect(roundTripped.hashChain).toHaveLength(bundle.hashChain.length);
  });
});
