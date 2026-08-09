import { requiresSnapshot } from "../journal/invariants.js";
import type {
  VerificationChecks,
  VerificationIssue,
  VerificationReport,
} from "../verification/verification-report.js";
import { EXECUTION_ARTIFACT_SCHEMA_VERSION, type ExecutionArtifact } from "./execution-artifact.js";
import { recomputeHashChain } from "./hash-chain.js";

/**
 * Independently re-verifies a sealed Execution Artifact end to end,
 * using only data embedded in the artifact — no database, no
 * StoragePort. This is what "Future replay should require only this
 * artifact" (Step 3.3) actually rests on: an artifact that passes this
 * function is provably self-contained and untampered, not merely
 * assumed to be.
 *
 * Never throws on a malformed/corrupted artifact — corruption is
 * reported as `issues`, not an exception. Callers that must refuse to
 * proceed on invalid input (the Replay Engine) check `report.valid`.
 */
export async function verifyArtifact(artifact: ExecutionArtifact): Promise<VerificationReport> {
  const issues: VerificationIssue[] = [];

  const schemaVersionSupported = artifact.schemaVersion === EXECUTION_ARTIFACT_SCHEMA_VERSION;
  if (!schemaVersionSupported) {
    issues.push({
      code: "UNSUPPORTED_SCHEMA_VERSION",
      message: `Artifact schema version "${artifact.schemaVersion}" is not supported (expected "${EXECUTION_ARTIFACT_SCHEMA_VERSION}")`,
      sequence: null,
    });
  }

  const eventOrdering = checkEventOrdering(artifact, issues);
  const identityConsistency = checkIdentityConsistency(artifact, issues);
  const snapshotConsistency = checkSnapshotConsistency(artifact, issues);
  const { hashChain, rootHash } = await checkHashChain(artifact, issues);

  const checks: VerificationChecks = {
    schemaVersionSupported,
    eventOrdering,
    identityConsistency,
    snapshotConsistency,
    hashChain,
    rootHash,
  };

  return {
    valid: Object.values(checks).every(Boolean),
    checkedAt: new Date(),
    checks,
    issues,
  };
}

function checkEventOrdering(artifact: ExecutionArtifact, issues: VerificationIssue[]): boolean {
  let ok = true;
  artifact.timeline.forEach((event, index) => {
    if (event.sequence !== index) {
      ok = false;
      issues.push({
        code: "SEQUENCE_GAP",
        message: `Expected sequence ${index} at timeline position ${index}, found ${event.sequence}`,
        sequence: event.sequence,
      });
    }
  });
  return ok;
}

function checkIdentityConsistency(
  artifact: ExecutionArtifact,
  issues: VerificationIssue[],
): boolean {
  let ok = true;
  for (const event of artifact.timeline) {
    if (event.executionId !== artifact.executionId) {
      ok = false;
      issues.push({
        code: "EVENT_IDENTITY_MISMATCH",
        message: `Event at sequence ${event.sequence} belongs to executionId "${event.executionId}", expected "${artifact.executionId}"`,
        sequence: event.sequence,
      });
    }
  }
  for (const snapshot of artifact.snapshots) {
    if (snapshot.executionId !== artifact.executionId) {
      ok = false;
      issues.push({
        code: "SNAPSHOT_IDENTITY_MISMATCH",
        message: `Snapshot "${snapshot.snapshotId}" belongs to executionId "${snapshot.executionId}", expected "${artifact.executionId}"`,
        sequence: null,
      });
    }
  }
  return ok;
}

function checkSnapshotConsistency(
  artifact: ExecutionArtifact,
  issues: VerificationIssue[],
): boolean {
  const snapshotsById = new Set(artifact.snapshots.map((snapshot) => snapshot.snapshotId));
  let ok = true;

  for (const event of artifact.timeline) {
    const needsSnapshot = requiresSnapshot(event);
    const hasRef = event.snapshotRef !== null;

    if (needsSnapshot !== hasRef) {
      ok = false;
      issues.push({
        code: "SNAPSHOT_REQUIREMENT_VIOLATION",
        message: `Event at sequence ${event.sequence} of kind "${event.kind}" ${
          needsSnapshot ? "requires a Snapshot but has none" : "must not carry a Snapshot"
        }`,
        sequence: event.sequence,
      });
      continue;
    }

    if (hasRef && event.snapshotRef && !snapshotsById.has(event.snapshotRef)) {
      ok = false;
      issues.push({
        code: "MISSING_SNAPSHOT",
        message: `Event at sequence ${event.sequence} references Snapshot "${event.snapshotRef}", which is not present in the artifact`,
        sequence: event.sequence,
      });
    }
  }
  return ok;
}

async function checkHashChain(
  artifact: ExecutionArtifact,
  issues: VerificationIssue[],
): Promise<{ hashChain: boolean; rootHash: boolean }> {
  try {
    const { rootHash: computed } = await recomputeHashChain(artifact);
    const matches = computed !== null && computed === artifact.rootHash;
    if (!matches) {
      issues.push({
        code: "ROOT_HASH_MISMATCH",
        message: `Recomputed root hash "${computed ?? "(none — empty timeline)"}" does not match artifact.rootHash "${artifact.rootHash}"`,
        sequence: null,
      });
    }
    return { hashChain: true, rootHash: matches };
  } catch {
    issues.push({
      code: "HASH_RECOMPUTATION_FAILED",
      message: "Could not recompute the hash chain from the artifact's timeline and snapshots",
      sequence: null,
    });
    return { hashChain: false, rootHash: false };
  }
}
