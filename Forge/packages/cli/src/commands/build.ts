import { writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { createAiPlugin } from "@forge/adapter-ai";
import { createAikenPlugin } from "@forge/adapter-aiken";
import { createCodegenTsPlugin } from "@forge/adapter-codegen-ts";
import { createEmulatorPlugin } from "@forge/adapter-emulator";
import { createFileSystemPlugin } from "@forge/adapter-filesystem";
import { createProvidersPlugin } from "@forge/adapter-providers";
import { createContractTemplatesPlugin } from "@forge/contract-templates";
import type { BuildFromDescriptionResult } from "@forge/sdk";
import { Forge } from "@forge/sdk";
import { createDemoWallet } from "../demo-wallet.js";
import { createConsoleLogger } from "../logger.js";
import type { ParsedBuildArgs } from "../parse-build-args.js";
import { parseBuildArgs } from "../parse-build-args.js";
import { createProgressNarratorPlugin } from "../progress-narrator-plugin.js";
import { slugify } from "../slugify.js";

export interface BuildCommandOptions {
  readonly cwd?: string;
}

export async function buildCommand(
  args: readonly string[],
  options: BuildCommandOptions = {},
): Promise<void> {
  const parsed: ParsedBuildArgs = parseBuildArgs(args);
  const projectName = parsed.name ?? slugify(parsed.description);
  const rootDir = resolve(options.cwd ?? process.cwd(), projectName);

  console.log(`\nForge — building "${parsed.description}"`);
  console.log(
    "(The model only classifies intent and extracts parameters — it never writes Aiken source; the deterministic template engine does.)\n",
  );

  const forge = await Forge.create({
    plugins: [
      createFileSystemPlugin(),
      createAikenPlugin(),
      createContractTemplatesPlugin(),
      createCodegenTsPlugin(),
      createEmulatorPlugin(),
      createProvidersPlugin(),
      createAiPlugin(),
      createProgressNarratorPlugin(),
    ],
    config: { projectRoot: rootDir, network: parsed.network, plugins: [] },
    logger: createConsoleLogger(),
  });

  const result = await forge.buildFromDescription({
    description: parsed.description,
    projectName,
    rootDir,
    network: parsed.network,
    wallets: [createDemoWallet()],
    testScenarios: [
      {
        name: "happy path",
        kind: "functional",
        description: "exercises the generated contract against a seeded demo wallet",
      },
    ],
    minConfidence: parsed.minConfidence,
  });

  await writeFile(
    join(rootDir, result.documentation.fileName),
    result.documentation.content,
    "utf8",
  );

  const templateRationale = result.rationales.find(
    (rationale) => rationale.category === "template-selection",
  );
  const parameterRationales = result.rationales.filter(
    (rationale) => rationale.category === "parameter",
  );

  const templateExplanation = templateRationale
    ? await forge.explain(templateRationale.subject, [templateRationale])
    : undefined;
  const parameterExplanation =
    parameterRationales.length > 0
      ? await forge.explain("parameters", parameterRationales)
      : undefined;

  printSummary(result, rootDir, {
    template: templateExplanation?.narrative,
    parameters: parameterExplanation?.narrative,
  });
}

function printSummary(
  result: BuildFromDescriptionResult,
  rootDir: string,
  explanations: { readonly template?: string; readonly parameters?: string },
): void {
  console.log("\nDone.\n");
  console.log(`Project:      ${rootDir}`);
  console.log(`Contract:     validators/${result.contract.fileName}`);
  console.log(
    `Blueprint:    ${result.blueprint.validators.length} validator(s), plutus ${result.blueprint.preamble.plutusVersion}`,
  );
  const relativeSdkPaths = result.sdkFiles.map((sdkFile) => relative(rootDir, sdkFile));
  console.log(`Typed SDK:    ${relativeSdkPaths.join(", ")}`);
  console.log(
    `Tests:        ${result.testReport.passedCount} passed, ${result.testReport.failedCount} failed`,
  );
  console.log(`Deployment:   ${result.deployment.address}`);
  console.log(`Docs:         ${result.documentation.fileName}`);

  if (explanations.template) {
    console.log(`\nWhy this template:\n${explanations.template}`);
  }
  if (explanations.parameters) {
    console.log(`\nWhy these parameters:\n${explanations.parameters}`);
  }
}
