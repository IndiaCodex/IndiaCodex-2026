import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryStorage } from "@sentinel/storage-memory";
import { SentinelExecutionJournal } from "@sentinel/execution-journal";
import { MockMasumiAdapter } from "@sentinel/adapter-masumi";
import { testExecutionId, testWorkflowId } from "@sentinel/testkit";
import { CaptureEventUseCase } from "../src/capture/capture-event-use-case.js";
import { GenerateExplainabilityReportUseCase } from "../src/assurance/generate-explainability-report-use-case.js";

describe("GenerateExplainabilityReportUseCase", () => {
  let storage: InMemoryStorage;
  let captureUseCase: CaptureEventUseCase;
  let explainUseCase: GenerateExplainabilityReportUseCase;

  beforeEach(() => {
    storage = new InMemoryStorage();
    const journal = new SentinelExecutionJournal(storage, "test@0.0.0");
    captureUseCase = new CaptureEventUseCase(storage, journal, new MockMasumiAdapter());
    explainUseCase = new GenerateExplainabilityReportUseCase(journal);
  });

  it("seals, replays, and explains a captured execution end to end", async () => {
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

    const result = await explainUseCase.execute(executionId);

    expect(result.artifact.executionId).toBe(executionId);
    expect(result.replay.fidelity).toBe("identical");
    expect(result.replay.verification.valid).toBe(true);
    expect(result.explainability.executionSummary.outcome).toBe("completed");
    expect(result.explainability.timelineSummary).toHaveLength(2);
    expect(result.explainability.journalIntegrity.intact).toBe(true);
    expect(result.explainability.replayValidation.replayed).toBe(true);
  });

  it("propagates ReplayIntegrityError-style rejection when the execution doesn't exist", async () => {
    await expect(explainUseCase.execute(testExecutionId())).rejects.toThrow();
  });
});
