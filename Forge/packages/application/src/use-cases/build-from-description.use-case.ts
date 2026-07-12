import type {
  Blueprint,
  DeploymentManifest,
  DocumentationArtifact,
  GeneratedContract,
  Network,
  Project,
  Rationale,
  ReviewReport,
  TestReport,
  TestScenario,
  Wallet,
} from "@forge/domain";
import { summarizeTestResults } from "@forge/domain";
import type { IFileSystemPort } from "../ports/file-system.port.js";
import type { CompileUseCase } from "./compile.use-case.js";
import type { DeployUseCase } from "./deploy.use-case.js";
import type { GenerateContractUseCase } from "./generate-contract.use-case.js";
import type { GenerateDocsUseCase } from "./generate-docs.use-case.js";
import type { GenerateSdkUseCase } from "./generate-sdk.use-case.js";
import type { GenerateSecurityTestsUseCase } from "./generate-security-tests.use-case.js";
import type { ReviewContractUseCase } from "./review-contract.use-case.js";
import type { RunTestsUseCase } from "./run-tests.use-case.js";
import type { ScaffoldProjectUseCase } from "./scaffold-project.use-case.js";

export interface BuildFromDescriptionInput {
  readonly description: string;
  readonly projectName: string;
  readonly rootDir: string;
  readonly network: Network;
  readonly wallets: readonly Wallet[];
  readonly testScenarios: readonly TestScenario[];
  /** Minimum template-match confidence required to proceed; see SelectTemplateUseCase. */
  readonly minConfidence?: number;
}

export interface BuildFromDescriptionResult {
  readonly project: Project;
  readonly contract: GeneratedContract;
  readonly blueprint: Blueprint;
  readonly sdkFiles: readonly string[];
  readonly testReport: TestReport;
  readonly review: ReviewReport;
  readonly documentation: DocumentationArtifact;
  readonly deployment: DeploymentManifest;
  readonly rationales: readonly Rationale[];
}

/**
 * The `forge build "<description>"` pipeline: generate (via the
 * deterministic Forge Engine, never the language model directly — rejecting
 * outright if nothing matches with enough confidence), scaffold, compile,
 * generate the typed SDK, test (functional + security), review, document,
 * and produce a deployment artifact — one call, in one fixed order.
 */
export class BuildFromDescriptionUseCase {
  constructor(
    private readonly scaffoldProject: ScaffoldProjectUseCase,
    private readonly generateContract: GenerateContractUseCase,
    private readonly compile: CompileUseCase,
    private readonly generateSdk: GenerateSdkUseCase,
    private readonly runTests: RunTestsUseCase,
    private readonly generateSecurityTests: GenerateSecurityTestsUseCase,
    private readonly reviewContract: ReviewContractUseCase,
    private readonly generateDocs: GenerateDocsUseCase,
    private readonly deploy: DeployUseCase,
    private readonly fileSystem: IFileSystemPort,
  ) {}

  async execute(input: BuildFromDescriptionInput): Promise<BuildFromDescriptionResult> {
    // Generate first, scaffold second: a low-confidence description must
    // throw before anything is written to disk, not after a project
    // directory already exists for it.
    const { contract, templateRationale, parameterRationales } =
      await this.generateContract.execute(input.description, input.minConfidence);

    const project = await this.scaffoldProject.execute({
      name: input.projectName,
      rootDir: input.rootDir,
    });

    await this.fileSystem.writeFile(
      `${project.rootDir}/validators/${contract.fileName}`,
      contract.source,
    );

    const blueprint = await this.compile.execute(project);
    const sdkFiles = await this.generateSdk.execute(project, blueprint);

    const functionalReport = await this.runTests.execute({
      project,
      wallets: input.wallets,
      scenarios: input.testScenarios,
    });
    const securityReport = await this.generateSecurityTests.execute(project, blueprint);
    const testReport = summarizeTestResults([
      ...functionalReport.results,
      ...securityReport.results,
    ]);

    const rationales = [templateRationale, ...parameterRationales];
    const review = await this.reviewContract.execute({ contract, blueprint, rationales });
    const documentation = await this.generateDocs.execute({ project, blueprint, review });

    const primaryValidator = blueprint.validators[0];
    if (!primaryValidator) {
      throw new Error("Compiled blueprint has no validators to deploy");
    }

    const deployment = await this.deploy.execute({
      project,
      validator: primaryValidator,
      network: input.network,
      blueprintHash: primaryValidator.hash,
    });

    return {
      project,
      contract,
      blueprint,
      sdkFiles,
      testReport,
      review,
      documentation,
      deployment,
      rationales,
    };
  }
}
