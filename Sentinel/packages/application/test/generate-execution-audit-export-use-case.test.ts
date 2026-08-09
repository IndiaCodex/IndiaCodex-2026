import { beforeEach, describe, expect, it } from "vitest";
import type { ExecutionAuditExport, ExportFormat, ExportPort } from "@sentinel/domain";
import { InMemoryStorage } from "@sentinel/storage-memory";
import { SentinelExecutionJournal } from "@sentinel/execution-journal";
import { MockMasumiAdapter } from "@sentinel/adapter-masumi";
import { testExecutionId, testWorkflowId } from "@sentinel/testkit";
import { CaptureEventUseCase } from "../src/capture/capture-event-use-case.js";
import { GenerateExplainabilityReportUseCase } from "../src/assurance/generate-explainability-report-use-case.js";
import { GenerateExecutionAuditExportUseCase } from "../src/assurance/generate-execution-audit-export-use-case.js";

class RecordingExportPort implements ExportPort {
  public lastBundle: ExecutionAuditExport | undefined;

  render(bundle: ExecutionAuditExport, format: ExportFormat): Promise<Uint8Array> {
    this.lastBundle = bundle;
    return Promise.resolve(new TextEncoder().encode(JSON.stringify({ bundle, format })));
  }
}

describe("GenerateExecutionAuditExportUseCase", () => {
  let storage: InMemoryStorage;
  let captureUseCase: CaptureEventUseCase;
  let exportUseCase: GenerateExecutionAuditExportUseCase;
  let exportPort: RecordingExportPort;

  beforeEach(() => {
    storage = new InMemoryStorage();
    const journal = new SentinelExecutionJournal(storage, "test@0.0.0");
    captureUseCase = new CaptureEventUseCase(storage, journal, new MockMasumiAdapter());
    exportPort = new RecordingExportPort();
    exportUseCase = new GenerateExecutionAuditExportUseCase(
      new GenerateExplainabilityReportUseCase(journal),
      exportPort,
    );
  });

  it("assembles and renders a complete bundle for a captured execution", async () => {
    const executionId = testExecutionId();
    const workflowId = testWorkflowId();

    await captureUseCase.execute({
      executionId,
      workflowId,
      sequence: 0,
      kind: "lifecycle",
      payload: { transition: "started" },
    });
    await captureUseCase.execute({
      executionId,
      workflowId,
      sequence: 1,
      kind: "lifecycle",
      payload: { transition: "completed" },
    });

    const bytes = await exportUseCase.execute(executionId);

    expect(bytes.length).toBeGreaterThan(0);
    expect(exportPort.lastBundle?.artifact.executionId).toBe(executionId);
    expect(exportPort.lastBundle?.verification.valid).toBe(true);
    expect(exportPort.lastBundle?.replay?.fidelity).toBe("identical");
    expect(exportPort.lastBundle?.explainability.executionSummary.outcome).toBe("completed");
    expect(exportPort.lastBundle?.hashChain.length).toBeGreaterThan(0);
  });

  it("passes the requested format through to ExportPort", async () => {
    const executionId = testExecutionId();
    await captureUseCase.execute({
      executionId,
      workflowId: testWorkflowId(),
      sequence: 0,
      kind: "lifecycle",
      payload: { transition: "started" },
    });
    await captureUseCase.execute({
      executionId,
      workflowId: testWorkflowId(),
      sequence: 1,
      kind: "lifecycle",
      payload: { transition: "completed" },
    });

    const bytes = await exportUseCase.execute(executionId, "json");
    const rendered = JSON.parse(new TextDecoder().decode(bytes)) as { format: string };

    expect(rendered.format).toBe("json");
  });
});
