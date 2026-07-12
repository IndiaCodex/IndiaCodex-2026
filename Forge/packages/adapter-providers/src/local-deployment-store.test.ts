import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DeploymentManifest } from "@forge/domain";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalDeploymentStore } from "./local-deployment-store.js";

const manifest: DeploymentManifest = {
  network: "preview",
  validatorTitle: "escrow_milestone.escrow_milestone.spend",
  scriptHash: "4486d627a370e46712a13da34221f864c4bab449e7d13884926342b7",
  address: "addr_test1abc",
  deployedAt: "2026-01-01T00:00:00.000Z",
  blueprintHash: "4486d627a370e46712a13da34221f864c4bab449e7d13884926342b7",
  setupTxHashes: [],
};

describe("LocalDeploymentStore", () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), "forge-deployment-store-"));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("writes a manifest and reads it back unchanged", async () => {
    const store = new LocalDeploymentStore(projectRoot);

    await store.write(manifest);
    const read = await store.read("preview", manifest.validatorTitle);

    expect(read).toEqual(manifest);
  });

  it("writes the manifest under deployments/<network>/<validatorTitle>.json", async () => {
    const store = new LocalDeploymentStore(projectRoot);

    await store.write(manifest);

    const expectedPath = join(
      projectRoot,
      "deployments",
      "preview",
      "escrow_milestone.escrow_milestone.spend.json",
    );
    const read = await store.read("preview", manifest.validatorTitle);
    expect(read).toBeDefined();
    // Confirm the exact path convention by reading the file directly.
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(expectedPath, "utf8");
    expect(JSON.parse(raw)).toEqual(manifest);
  });

  it("returns undefined for a manifest that was never written", async () => {
    const store = new LocalDeploymentStore(projectRoot);

    expect(await store.read("preview", "no-such-validator")).toBeUndefined();
  });
});
