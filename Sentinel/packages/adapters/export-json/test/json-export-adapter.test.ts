import { describe, expect, it } from "vitest";
import {
  appendJournalEntry,
  assembleExecutionAuditExport,
  createTraceId,
  parseWorkflowId,
  replayArtifact,
  resolveCorrelationId,
  sealJournal,
  verifyArtifact,
  type JournalEntry,
} from "@sentinel/domain";
import { buildExplainabilityReport } from "@sentinel/explainability";
import { buildLifecycleEvent, buildToolCompletedEvent, testExecutionId } from "@sentinel/testkit";
import { JsonExportAdapter } from "../src/json-export-adapter.js";
import { UnsupportedExportFormatError } from "../src/unsupported-export-format-error.js";

async function buildRealBundle() {
  const executionId = testExecutionId();
  const entries: JournalEntry[] = [];
  const append = async (
    event: Parameters<typeof appendJournalEntry>[1],
    snapshot: Parameters<typeof appendJournalEntry>[2],
  ) => {
    const entry = await appendJournalEntry(entries, event, snapshot);
    entries.push(entry);
    return entry;
  };
  await append(buildLifecycleEvent(executionId, 0, "started"), null);
  const { event, snapshot } = buildToolCompletedEvent(executionId, 1);
  await append(event, snapshot);
  await append(buildLifecycleEvent(executionId, 2, "completed"), null);

  const artifact = sealJournal({
    executionId,
    workflowId: parseWorkflowId("export-test-workflow"),
    correlationId: resolveCorrelationId(executionId),
    traceId: createTraceId(),
    entries,
    producedBy: { sdkVersion: "test@0.0.0", journalVersion: "test@0.0.0" },
  });

  const verification = await verifyArtifact(artifact);
  const replay = await replayArtifact(artifact);
  const explainability = buildExplainabilityReport({ artifact, verification, replay });

  return assembleExecutionAuditExport({ artifact, verification, replay, explainability });
}

describe("JsonExportAdapter", () => {
  it("renders a complete, valid JSON document", async () => {
    const bundle = await buildRealBundle();
    const adapter = new JsonExportAdapter();

    const bytes = await adapter.render(bundle, "json");
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as typeof bundle;

    expect(parsed.exportSchemaVersion).toBe(bundle.exportSchemaVersion);
    expect(parsed.artifact.executionId).toBe(bundle.artifact.executionId);
    expect(parsed.artifact.rootHash).toBe(bundle.artifact.rootHash);
    expect(parsed.hashChain).toHaveLength(bundle.hashChain.length);
    expect(parsed.verification.valid).toBe(true);
    expect(parsed.replay?.fidelity).toBe("identical");
    expect(parsed.explainability.executionSummary.outcome).toBe("completed");
  });

  it("produces self-contained output: every field needed to audit the execution is present", async () => {
    const bundle = await buildRealBundle();
    const adapter = new JsonExportAdapter();

    const parsed = JSON.parse(
      new TextDecoder().decode(await adapter.render(bundle, "json")),
    ) as Record<string, unknown>;

    for (const field of [
      "exportSchemaVersion",
      "exportedAt",
      "artifact",
      "hashChain",
      "verification",
      "replay",
      "explainability",
    ]) {
      expect(parsed).toHaveProperty(field);
    }
  });

  it("rejects an unsupported format with a typed error", async () => {
    const bundle = await buildRealBundle();
    const adapter = new JsonExportAdapter();

    // @ts-expect-error -- deliberately passing an unsupported format to test the runtime guard
    await expect(adapter.render(bundle, "pdf")).rejects.toThrow(UnsupportedExportFormatError);
  });
});
