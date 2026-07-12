import type { Project } from "@forge/domain";
import type { IFileSystemPort } from "../ports/file-system.port.js";
import type { PlatformRegistry } from "../registry/platform-registry.js";

export interface ScaffoldProjectInput {
  readonly name: string;
  readonly rootDir: string;
}

export class ScaffoldProjectUseCase {
  constructor(
    private readonly fileSystem: IFileSystemPort,
    private readonly registry: PlatformRegistry,
  ) {}

  async execute(input: ScaffoldProjectInput): Promise<Project> {
    const project: Project = { name: input.name, rootDir: input.rootDir };

    await this.fileSystem.mkdir(`${input.rootDir}/validators`);
    await this.fileSystem.mkdir(`${input.rootDir}/tests`);
    await this.fileSystem.writeFile(
      `${input.rootDir}/README.md`,
      `# ${input.name}\n\nScaffolded by Forge.\n`,
    );

    await this.registry.fireHook("onProjectInit", { project });

    return project;
  }
}
