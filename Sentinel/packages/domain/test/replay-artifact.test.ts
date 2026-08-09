import { describe, expect, it } from "vitest";
import { ReplayIntegrityError, replayArtifact } from "../src/index.js";
import { buildSampleArtifact } from "./fixtures.js";

describe("replayArtifact", () => {
  it("reconstructs the Timeline and Snapshots exactly as recorded", async () => {
    const { artifact } = await buildSampleArtifact();
    const session = await replayArtifact(artifact);

    expect(session.sourceExecutionId).toBe(artifact.executionId);
    expect(session.sourceArtifactId).toBe(artifact.artifactId);
    expect(session.replayedTimeline).toEqual(artifact.timeline);
    expect(session.replayedSnapshots).toEqual(artifact.snapshots);
    expect(session.fidelity).toBe("identical");
    expect(session.divergedAt).toBeNull();
  });

  it("preserves event ordering and original timestamps", async () => {
    const { artifact } = await buildSampleArtifact();
    const session = await replayArtifact(artifact);

    expect(session.replayedTimeline.map((event) => event.sequence)).toEqual(
      artifact.timeline.map((event) => event.sequence),
    );
    expect(session.replayedTimeline.map((event) => event.occurredAt.getTime())).toEqual(
      artifact.timeline.map((event) => event.occurredAt.getTime()),
    );
  });

  it("embeds a passing VerificationReport", async () => {
    const { artifact } = await buildSampleArtifact();
    const session = await replayArtifact(artifact);

    expect(session.verification.valid).toBe(true);
  });

  it("is deterministic: replaying twice produces the same reconstructed timeline", async () => {
    const { artifact } = await buildSampleArtifact();
    const first = await replayArtifact(artifact);
    const second = await replayArtifact(artifact);

    expect(first.replayedTimeline).toEqual(second.replayedTimeline);
    expect(first.fidelity).toBe(second.fidelity);
    // replaySessionId/replayedAt are intentionally unique per invocation, like artifactId per seal.
    expect(first.replaySessionId).not.toBe(second.replaySessionId);
  });

  it("refuses to replay a tampered artifact and throws ReplayIntegrityError", async () => {
    const { artifact } = await buildSampleArtifact();
    const tampered = {
      ...artifact,
      timeline: artifact.timeline.map((event, index) =>
        index === 3 && event.kind === "decision"
          ? { ...event, payload: { ...event.payload, summary: "INJECTED" } }
          : event,
      ),
    };

    await expect(replayArtifact(tampered)).rejects.toThrow(ReplayIntegrityError);
  });

  it("attaches the failing VerificationReport to the thrown error", async () => {
    const { artifact } = await buildSampleArtifact();
    const tampered = { ...artifact, snapshots: [] };

    let error: unknown;
    try {
      await replayArtifact(tampered);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ReplayIntegrityError);
    const replayError = error as ReplayIntegrityError;
    expect(replayError.report.valid).toBe(false);
    expect(replayError.executionId).toBe(artifact.executionId);
  });

  it("refuses to replay when required Snapshots are missing entirely", async () => {
    const { artifact } = await buildSampleArtifact();
    const tampered = { ...artifact, snapshots: [] };

    await expect(replayArtifact(tampered)).rejects.toThrow(ReplayIntegrityError);
  });
});
