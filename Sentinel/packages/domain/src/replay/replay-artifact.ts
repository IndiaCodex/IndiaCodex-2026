import { uuidv7 } from "../shared/uuid.js";
import type { ExecutionId } from "../identity/execution-id.js";
import type { ExecutionArtifact } from "../artifact/execution-artifact.js";
import { verifyArtifact } from "../artifact/verify-artifact.js";
import type { VerificationReport } from "../verification/verification-report.js";
import type { ReplaySession, ReplaySessionId } from "./replay-session.js";

/**
 * Thrown when an artifact fails integrity verification and replay is
 * refused. Carries the full `VerificationReport` so a caller can report
 * exactly which check(s) failed, not just that replay didn't happen.
 */
export class ReplayIntegrityError extends Error {
  constructor(
    public readonly executionId: ExecutionId,
    public readonly report: VerificationReport,
  ) {
    const failedChecks = Object.entries(report.checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => name);
    super(
      `Refusing to replay execution "${executionId}": artifact failed integrity verification (${failedChecks.join(", ")})`,
    );
    this.name = "ReplayIntegrityError";
  }
}

/**
 * Deterministically replays a sealed Execution Artifact (ADR-0001,
 * ADR-0006). Operates exclusively on the artifact's embedded Events and
 * Snapshots — no LLM, external API, live tool, or Masumi call is ever
 * made, and no StoragePort or other I/O is touched, which is what makes
 * an exported artifact alone sufficient to replay.
 *
 * Verifies the artifact first (`verifyArtifact`) and throws
 * `ReplayIntegrityError` immediately on any failure — replay never
 * proceeds against data that can't be trusted.
 */
export async function replayArtifact(artifact: ExecutionArtifact): Promise<ReplaySession> {
  const verification = await verifyArtifact(artifact);
  if (!verification.valid) {
    throw new ReplayIntegrityError(artifact.executionId, verification);
  }

  return {
    replaySessionId: uuidv7() as ReplaySessionId,
    sourceArtifactId: artifact.artifactId,
    sourceExecutionId: artifact.executionId,
    replayedTimeline: artifact.timeline,
    replayedSnapshots: artifact.snapshots,
    fidelity: "identical",
    divergedAt: null,
    verification,
    replayedAt: new Date(),
  };
}
