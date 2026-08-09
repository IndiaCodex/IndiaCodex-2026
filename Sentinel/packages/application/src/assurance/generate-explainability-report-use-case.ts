import type {
  EngineeringExplainabilityReport,
  ExecutionArtifact,
  ExecutionId,
  ExecutionJournalPort,
  ReplaySession,
} from "@sentinel/domain";
import { buildExplainabilityReport } from "@sentinel/explainability";

export interface ExplainabilityResult {
  readonly artifact: ExecutionArtifact;
  readonly replay: ReplaySession;
  readonly explainability: EngineeringExplainabilityReport;
}

/**
 * Produces the full Engineering Mode explanation of an Execution
 * (ADR-0002): seals the Journal if needed, replays the sealed artifact
 * (which validates journal and artifact integrity — Step 3.3's
 * Verification Engine — before anything else runs), then derives the
 * deterministic explainability report from the result. Shared by the
 * standalone explain route and `GenerateExecutionAuditExportUseCase`,
 * so "seal, replay, explain" is implemented in exactly one place.
 */
export class GenerateExplainabilityReportUseCase {
  constructor(private readonly journal: ExecutionJournalPort) {}

  async execute(executionId: ExecutionId): Promise<ExplainabilityResult> {
    const artifact = await this.journal.seal(executionId);
    const replay = await this.journal.replay(executionId);
    const explainability = buildExplainabilityReport({
      artifact,
      verification: replay.verification,
      replay,
    });

    return { artifact, replay, explainability };
  }
}
