import type { ExecutionArtifact } from "../artifact/execution-artifact.js";
import { recomputeHashChain, type HashChainEntry } from "../artifact/hash-chain.js";
import type { VerificationReport } from "../verification/verification-report.js";
import type { ReplaySession } from "../replay/replay-session.js";
import type { EngineeringExplainabilityReport } from "../explanation/engineering-explainability-report.js";

export const EXECUTION_AUDIT_EXPORT_SCHEMA_VERSION = "1.0.0";

/**
 * The complete, portable, self-contained export of an Execution
 * (Step 3.3): the sealed Execution Artifact plus everything Sentinel
 * can determine about it — its recomputed hash chain, integrity
 * verification, a replay session proving the artifact is
 * self-sufficient, and its Engineering Mode explanation. A reader needs
 * nothing else to audit this execution: not the database, not a live
 * Sentinel instance, not the original agent.
 *
 * `exportSchemaVersion` versions this envelope independently of
 * `artifact.schemaVersion`, which versions the artifact alone — the two
 * evolve on separate timelines.
 */
export interface ExecutionAuditExport {
  readonly exportSchemaVersion: string;
  readonly exportedAt: Date;
  readonly artifact: ExecutionArtifact;
  readonly hashChain: readonly HashChainEntry[];
  readonly verification: VerificationReport;
  readonly replay: ReplaySession | null;
  readonly explainability: EngineeringExplainabilityReport;
}

export interface AssembleExecutionAuditExportInput {
  readonly artifact: ExecutionArtifact;
  readonly verification: VerificationReport;
  readonly replay: ReplaySession | null;
  readonly explainability: EngineeringExplainabilityReport;
  readonly exportedAt?: Date;
}

/**
 * Assembles the portable export envelope around an already-sealed
 * artifact. Pure aside from the hash chain recomputation (deterministic
 * given the artifact) and the `exportedAt` timestamp — assembling the
 * same inputs twice (with an explicit `exportedAt`) produces identical
 * output.
 */
export async function assembleExecutionAuditExport(
  input: AssembleExecutionAuditExportInput,
): Promise<ExecutionAuditExport> {
  const { entries } = await recomputeHashChain(input.artifact);

  return {
    exportSchemaVersion: EXECUTION_AUDIT_EXPORT_SCHEMA_VERSION,
    exportedAt: input.exportedAt ?? new Date(),
    artifact: input.artifact,
    hashChain: entries,
    verification: input.verification,
    replay: input.replay,
    explainability: input.explainability,
  };
}
