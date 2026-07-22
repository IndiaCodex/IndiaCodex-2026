import {
  assembleExecutionAuditExport,
  type ExecutionId,
  type ExportFormat,
  type ExportPort,
} from "@sentinel/domain";
import type { GenerateExplainabilityReportUseCase } from "./generate-explainability-report-use-case.js";

/**
 * Produces the complete, portable Execution Artifact Export (Step 3.3):
 * seal + replay + verify + explain, assembled into one
 * `ExecutionAuditExport` bundle and rendered through `ExportPort`.
 * Reuses `GenerateExplainabilityReportUseCase` rather than re-running
 * seal/replay itself, so the two use cases can never disagree about
 * what "explain this execution" means.
 */
export class GenerateExecutionAuditExportUseCase {
  constructor(
    private readonly explainabilityUseCase: GenerateExplainabilityReportUseCase,
    private readonly exportPort: ExportPort,
  ) {}

  async execute(executionId: ExecutionId, format: ExportFormat = "json"): Promise<Uint8Array> {
    const { artifact, replay, explainability } =
      await this.explainabilityUseCase.execute(executionId);
    const bundle = await assembleExecutionAuditExport({
      artifact,
      verification: replay.verification,
      replay,
      explainability,
    });
    return this.exportPort.render(bundle, format);
  }
}
