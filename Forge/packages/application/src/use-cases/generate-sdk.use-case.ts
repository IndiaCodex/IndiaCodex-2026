import type { Blueprint, Project } from "@forge/domain";
import type { ISdkGeneratorPort } from "../ports/sdk-generator.port.js";
import type { PlatformRegistry } from "../registry/platform-registry.js";

export class GenerateSdkUseCase {
  constructor(
    private readonly sdkGenerator: ISdkGeneratorPort,
    private readonly registry: PlatformRegistry,
  ) {}

  async execute(project: Project, blueprint: Blueprint): Promise<readonly string[]> {
    const outDir = `${project.rootDir}/sdk/generated`;
    const files = await this.sdkGenerator.generate(blueprint, outDir);
    await this.registry.fireHook("onSdkGenerated", { project });
    return files;
  }
}
