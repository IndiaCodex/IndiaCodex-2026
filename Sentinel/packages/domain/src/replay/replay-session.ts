import type { Brand } from "../shared/brand.js";
import type { ExecutionId } from "../identity/execution-id.js";
import type { ExecutionArtifactId } from "../artifact/execution-artifact.js";
import type { Event } from "../events/event.js";
import type { Snapshot } from "../snapshot/snapshot.js";
import type { VerificationReport } from "../verification/verification-report.js";

export type ReplaySessionId = Brand<string, "ReplaySessionId">;

export type ReplayFidelity = "identical" | "diverged";

/**
 * The result of replaying a sealed Execution Artifact (ADR-0001):
 * the reconstructed Timeline and the Snapshots it was built from,
 * preserved exactly as recorded (never re-invoking a live LLM, tool,
 * external API, or Masumi service), plus the `VerificationReport` that
 * gated the replay — `replayArtifact` refuses to produce a session at
 * all when verification fails, so a `ReplaySession` existing is itself
 * evidence the source artifact was intact at `replayedAt`.
 *
 * `fidelity` is `"identical"` whenever verification passes, because
 * Sentinel reconstructs the Timeline from the artifact's own recorded
 * Events rather than re-executing independent agent code — there is
 * nothing external for the reconstruction to diverge from. `"diverged"`
 * / `divergedAt` are reserved for a future replay mode that re-runs
 * instrumented agent code against captured Snapshots (out of scope for
 * the Hackathon MVP; see the Step 3.3 summary for what's deferred).
 */
export interface ReplaySession {
  readonly replaySessionId: ReplaySessionId;
  readonly sourceArtifactId: ExecutionArtifactId | null;
  readonly sourceExecutionId: ExecutionId;
  readonly replayedTimeline: readonly Event[];
  readonly replayedSnapshots: readonly Snapshot[];
  readonly fidelity: ReplayFidelity;
  readonly divergedAt: number | null;
  readonly verification: VerificationReport;
  readonly replayedAt: Date;
}
