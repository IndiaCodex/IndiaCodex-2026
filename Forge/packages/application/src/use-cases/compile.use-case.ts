import type { Blueprint, Project } from "@forge/domain";
import type { IAikenCompilerPort } from "../ports/aiken-compiler.port.js";
import type { PlatformRegistry } from "../registry/platform-registry.js";

export class CompileUseCase {
  constructor(
    private readonly aikenCompiler: IAikenCompilerPort,
    private readonly registry: PlatformRegistry,
  ) {}

  async execute(project: Project): Promise<Blueprint> {
    await this.registry.fireHook("beforeCompile", { project });
    await this.aikenCompiler.ensureProject(project.rootDir, project.name);
    const blueprint = await this.aikenCompiler.build(project.rootDir);
    await this.registry.fireHook("afterCompile", { project, blueprint });
    return blueprint;
  }
}
