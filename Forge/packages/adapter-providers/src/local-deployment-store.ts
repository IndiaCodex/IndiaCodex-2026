import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { IDeploymentStorePort } from "@forge/application";
import type { DeploymentManifest, Network } from "@forge/domain";

function sanitizeForFilename(value: string): string {
  return value.replaceAll(/[^a-zA-Z0-9_.-]/g, "_");
}

/**
 * A real, versionable deployment artifact: one JSON file per
 * (network, validator), written under `<projectRoot>/deployments/`,
 * meant to be committed and reviewed like any other code change — not
 * an ad hoc note.
 */
export class LocalDeploymentStore implements IDeploymentStorePort {
  constructor(private readonly projectRoot: string) {}

  async write(manifest: DeploymentManifest): Promise<void> {
    const dir = join(this.projectRoot, "deployments", manifest.network);
    await mkdir(dir, { recursive: true });
    const filePath = join(dir, `${sanitizeForFilename(manifest.validatorTitle)}.json`);
    await writeFile(filePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }

  async read(network: Network, validatorTitle: string): Promise<DeploymentManifest | undefined> {
    const filePath = join(
      this.projectRoot,
      "deployments",
      network,
      `${sanitizeForFilename(validatorTitle)}.json`,
    );
    try {
      const raw = await readFile(filePath, "utf8");
      return JSON.parse(raw) as DeploymentManifest;
    } catch {
      return undefined;
    }
  }
}
