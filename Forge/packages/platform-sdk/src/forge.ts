import type {
  Blueprint,
  DeploymentManifest,
  DocumentationArtifact,
  Explanation,
  Project,
  Rationale,
  ResolvedForgeConfig,
  ReviewReport,
  TestReport,
} from "@forge/domain";
import {
  CompileUseCase,
  DeployUseCase,
  ExplainUseCase,
  GenerateContractUseCase,
  GenerateDocsUseCase,
  GenerateSdkUseCase,
  GenerateSecurityTestsUseCase,
  IAikenCompilerPortToken,
  IChainProviderPortToken,
  IContractTemplateEnginePortToken,
  IDeploymentStorePortToken,
  IEmulatorPortToken,
  IFileSystemPortToken,
  ILanguageModelPortToken,
  ISdkGeneratorPortToken,
  ITxBuilderPortToken,
  ReviewContractUseCase,
  RunTestsUseCase,
  ScaffoldProjectUseCase,
  SelectTemplateUseCase,
} from "@forge/application";
import type {
  BuildFromDescriptionInput,
  BuildFromDescriptionResult,
  DeployInput,
  GenerateContractResult,
  GenerateDocsInput,
  ILanguageModelPort,
  PlatformRegistry,
  ReviewContractInput,
  RunTestsInput,
  ScaffoldProjectInput,
} from "@forge/application";
import { BuildFromDescriptionUseCase } from "@forge/application";
import type { CommandDefinition, ForgePlugin, Logger, PortToken } from "@forge/plugin-api";
import { loadPlugins } from "@forge/plugin-loader";

export interface CreateForgeInput {
  readonly plugins: readonly ForgePlugin[];
  readonly config: ResolvedForgeConfig;
  readonly logger: Logger;
  readonly requiredPorts?: readonly PortToken<unknown>[];
}

/**
 * The single package every presentation layer (the CLI today, a future
 * IDE extension or web playground) depends on. It contains no business
 * logic of its own — every method here resolves ports from the registry
 * that plugin loading produced and delegates to an application-layer use
 * case, so a new presentation layer never needs to re-implement any of
 * this wiring.
 */
export class Forge {
  private constructor(private readonly registry: PlatformRegistry) {}

  static async create(input: CreateForgeInput): Promise<Forge> {
    const registry = await loadPlugins(input);
    return new Forge(registry);
  }

  get commands(): readonly CommandDefinition[] {
    return this.registry.getCommands();
  }

  async scaffoldProject(input: ScaffoldProjectInput): Promise<Project> {
    return this.scaffoldProjectUseCase().execute(input);
  }

  async compile(project: Project): Promise<Blueprint> {
    return this.compileUseCase().execute(project);
  }

  async generateSdk(project: Project, blueprint: Blueprint): Promise<readonly string[]> {
    return this.generateSdkUseCase().execute(project, blueprint);
  }

  async runTests(input: RunTestsInput): Promise<TestReport> {
    return this.runTestsUseCase().execute(input);
  }

  async generateSecurityTests(project: Project, blueprint: Blueprint): Promise<TestReport> {
    return new GenerateSecurityTestsUseCase(this.registry).execute(project, blueprint);
  }

  async deploy(input: DeployInput): Promise<DeploymentManifest> {
    return this.deployUseCase().execute(input);
  }

  async generateContract(
    description: string,
    minConfidence?: number,
  ): Promise<GenerateContractResult> {
    return this.generateContractUseCase().execute(description, minConfidence);
  }

  async reviewContract(input: ReviewContractInput): Promise<ReviewReport> {
    return new ReviewContractUseCase(this.registry.getPort(ILanguageModelPortToken)).execute(input);
  }

  async explain(subject: string, rationales: readonly Rationale[]): Promise<Explanation> {
    return new ExplainUseCase(this.optionalLanguageModel()).execute(subject, rationales);
  }

  async generateDocs(input: GenerateDocsInput): Promise<DocumentationArtifact> {
    return new GenerateDocsUseCase(this.optionalLanguageModel()).execute(input);
  }

  async buildFromDescription(
    input: BuildFromDescriptionInput,
  ): Promise<BuildFromDescriptionResult> {
    const orchestrator = new BuildFromDescriptionUseCase(
      this.scaffoldProjectUseCase(),
      this.generateContractUseCase(),
      this.compileUseCase(),
      this.generateSdkUseCase(),
      this.runTestsUseCase(),
      new GenerateSecurityTestsUseCase(this.registry),
      new ReviewContractUseCase(this.registry.getPort(ILanguageModelPortToken)),
      new GenerateDocsUseCase(this.optionalLanguageModel()),
      this.deployUseCase(),
      this.registry.getPort(IFileSystemPortToken),
    );
    return orchestrator.execute(input);
  }

  private optionalLanguageModel(): ILanguageModelPort | undefined {
    return this.registry.hasPort(ILanguageModelPortToken)
      ? this.registry.getPort(ILanguageModelPortToken)
      : undefined;
  }

  private scaffoldProjectUseCase(): ScaffoldProjectUseCase {
    return new ScaffoldProjectUseCase(this.registry.getPort(IFileSystemPortToken), this.registry);
  }

  private compileUseCase(): CompileUseCase {
    return new CompileUseCase(this.registry.getPort(IAikenCompilerPortToken), this.registry);
  }

  private generateSdkUseCase(): GenerateSdkUseCase {
    return new GenerateSdkUseCase(this.registry.getPort(ISdkGeneratorPortToken), this.registry);
  }

  private runTestsUseCase(): RunTestsUseCase {
    return new RunTestsUseCase(
      this.registry.getPort(IAikenCompilerPortToken),
      this.registry.getPort(IEmulatorPortToken),
      this.registry,
    );
  }

  private deployUseCase(): DeployUseCase {
    return new DeployUseCase(
      this.registry.getPort(IChainProviderPortToken),
      this.registry.getPort(ITxBuilderPortToken),
      this.registry.getPort(IDeploymentStorePortToken),
      this.registry,
    );
  }

  private generateContractUseCase(): GenerateContractUseCase {
    return new GenerateContractUseCase(
      this.registry.getPort(ILanguageModelPortToken),
      this.registry.getPort(IContractTemplateEnginePortToken),
      new SelectTemplateUseCase(),
    );
  }
}
