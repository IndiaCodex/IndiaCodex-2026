import { describe, expect, it } from "vitest";
import { verifyArtifact } from "../src/index.js";
import { buildSampleArtifact } from "./fixtures.js";

describe("verifyArtifact", () => {
  it("passes every check for an untampered artifact", async () => {
    const { artifact } = await buildSampleArtifact();
    const report = await verifyArtifact(artifact);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
    expect(report.checks).toEqual({
      schemaVersionSupported: true,
      eventOrdering: true,
      identityConsistency: true,
      snapshotConsistency: true,
      hashChain: true,
      rootHash: true,
    });
  });

  it("detects an unsupported schema version", async () => {
    const { artifact } = await buildSampleArtifact();
    const report = await verifyArtifact({ ...artifact, schemaVersion: "0.0.1" });

    expect(report.valid).toBe(false);
    expect(report.checks.schemaVersionSupported).toBe(false);
    expect(report.issues.map((i) => i.code)).toContain("UNSUPPORTED_SCHEMA_VERSION");
  });

  it("detects a sequence gap", async () => {
    const { artifact } = await buildSampleArtifact();
    const tampered = {
      ...artifact,
      timeline: artifact.timeline.map((event, index) =>
        index === 2 ? { ...event, sequence: 99 } : event,
      ),
    };
    const report = await verifyArtifact(tampered);

    expect(report.valid).toBe(false);
    expect(report.checks.eventOrdering).toBe(false);
    expect(report.issues.some((i) => i.code === "SEQUENCE_GAP")).toBe(true);
  });

  it("detects an event belonging to a different executionId", async () => {
    const { artifact } = await buildSampleArtifact();
    const tampered = {
      ...artifact,
      timeline: artifact.timeline.map((event, index) =>
        index === 1
          ? { ...event, executionId: "not-the-same-execution" as typeof event.executionId }
          : event,
      ),
    };
    const report = await verifyArtifact(tampered);

    expect(report.valid).toBe(false);
    expect(report.checks.identityConsistency).toBe(false);
    expect(report.issues.some((i) => i.code === "EVENT_IDENTITY_MISMATCH")).toBe(true);
  });

  it("detects a missing snapshot referenced by an event", async () => {
    const { artifact } = await buildSampleArtifact();
    const tampered = {
      ...artifact,
      snapshots: artifact.snapshots.filter((_, index) => index !== 0),
    };
    const report = await verifyArtifact(tampered);

    expect(report.valid).toBe(false);
    expect(report.checks.snapshotConsistency).toBe(false);
    expect(report.issues.some((i) => i.code === "MISSING_SNAPSHOT")).toBe(true);
  });

  it("detects an event carrying a Snapshot it shouldn't (lifecycle)", async () => {
    const { artifact } = await buildSampleArtifact();
    const someSnapshot = artifact.snapshots[0]!;
    const tampered = {
      ...artifact,
      timeline: artifact.timeline.map((event) =>
        event.kind === "lifecycle" ? { ...event, snapshotRef: someSnapshot.snapshotId } : event,
      ),
    };
    const report = await verifyArtifact(tampered);

    expect(report.valid).toBe(false);
    expect(report.checks.snapshotConsistency).toBe(false);
    expect(report.issues.some((i) => i.code === "SNAPSHOT_REQUIREMENT_VIOLATION")).toBe(true);
  });

  it("detects a tampered event payload that no longer matches the root hash", async () => {
    const { artifact } = await buildSampleArtifact();
    const tampered = {
      ...artifact,
      timeline: artifact.timeline.map((event, index) =>
        index === 3 && event.kind === "decision"
          ? { ...event, payload: { ...event.payload, summary: "INJECTED" } }
          : event,
      ),
    };
    const report = await verifyArtifact(tampered);

    expect(report.valid).toBe(false);
    expect(report.checks.rootHash).toBe(false);
    expect(report.issues.some((i) => i.code === "ROOT_HASH_MISMATCH")).toBe(true);
  });

  it("detects a tampered rootHash", async () => {
    const { artifact } = await buildSampleArtifact();
    const lastChar = artifact.rootHash.slice(-1);
    const flipped = lastChar === "0" ? "1" : "0";
    const tampered = {
      ...artifact,
      rootHash: `${artifact.rootHash.slice(0, -1)}${flipped}` as typeof artifact.rootHash,
    };

    const report = await verifyArtifact(tampered);

    expect(report.valid).toBe(false);
    expect(report.checks.rootHash).toBe(false);
  });

  it("never throws, even for a structurally tampered artifact", async () => {
    const { artifact } = await buildSampleArtifact();
    const tampered = { ...artifact, timeline: [], snapshots: [] };

    await expect(verifyArtifact(tampered)).resolves.toBeDefined();
  });
});
