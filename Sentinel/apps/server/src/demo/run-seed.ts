import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isExecutionId, type Event } from "@sentinel/domain";
import type { CaptureEventCommand } from "@sentinel/application";
import { loadConfig } from "../config.js";
import { buildDependencies, type AppDependencies } from "../composition.js";
import { CANONICAL_EXECUTION_ID, buildCanonicalWorkflowCommands } from "./canonical-workflow.js";
import {
  TOOL_FAILURE_EXECUTION_ID,
  buildToolFailureWorkflowCommands,
} from "./tool-failure-workflow.js";
import {
  PAYMENT_FAILURE_EXECUTION_ID,
  buildPaymentFailureWorkflowCommands,
} from "./payment-failure-workflow.js";
import {
  INTERRUPTED_EXECUTION_ID,
  buildInterruptedWorkflowCommands,
} from "./interrupted-workflow.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface DemoScenario {
  readonly label: string;
  readonly executionId: string;
  readonly outputSlug: string;
  readonly buildCommands: () => CaptureEventCommand[] | Promise<CaptureEventCommand[]>;
}

const SCENARIOS: readonly DemoScenario[] = [
  {
    label: "Successful workflow (customer-refund-agent)",
    executionId: CANONICAL_EXECUTION_ID,
    outputSlug: "01-success",
    buildCommands: buildCanonicalWorkflowCommands,
  },
  {
    label: "Tool failure (inventory-restock-agent)",
    executionId: TOOL_FAILURE_EXECUTION_ID,
    outputSlug: "02-tool-failure",
    buildCommands: buildToolFailureWorkflowCommands,
  },
  {
    label: "Payment failure (subscription-renewal-agent)",
    executionId: PAYMENT_FAILURE_EXECUTION_ID,
    outputSlug: "03-payment-failure",
    buildCommands: buildPaymentFailureWorkflowCommands,
  },
  {
    label: "Interrupted execution (document-processing-agent)",
    executionId: INTERRUPTED_EXECUTION_ID,
    outputSlug: "04-interrupted",
    buildCommands: buildInterruptedWorkflowCommands,
  },
];

/**
 * Reports when `CaptureEventUseCase` enriched a payment via
 * `MasumiAdapterPort` during capture — makes the live Masumi touchpoint
 * visible in the seed script's own output, not just discoverable by
 * reading source.
 */
function describeMasumiEnrichment(event: Event): string {
  if (event.kind !== "payment" || event.payload.phase !== "completed") return "";
  if (!event.payload.masumiReference) return "";
  return ` — enriched via MasumiAdapterPort (masumiReference=${event.payload.masumiReference})`;
}

/**
 * Drives one demo scenario through the complete Engineering Assurance
 * pipeline (Step 3.3/3.5):
 *
 *   Capture -> Journal -> Replay -> Verification -> Explainability -> Export
 *
 * Runs identically regardless of how the scenario ends — completed,
 * failed, or never terminated at all. That uniformity is the point: an
 * interrupted execution gets exactly the same assurance tooling as a
 * clean success, because nothing in the pipeline requires a terminal
 * lifecycle event to exist.
 */
async function runScenario(
  deps: AppDependencies,
  scenario: DemoScenario,
  outDir: string,
): Promise<void> {
  if (!isExecutionId(scenario.executionId)) {
    throw new Error(
      `Scenario "${scenario.label}" has an invalid executionId: "${scenario.executionId}"`,
    );
  }

  console.log(`\n=== ${scenario.label} ===`);

  const existing = await deps.storage.getExecution(scenario.executionId);
  if (existing) {
    console.log(`  already captured (status: ${existing.status}) — skipping capture`);
  } else {
    const commands = await scenario.buildCommands();
    for (const command of commands) {
      const result = await deps.captureEventUseCase.execute(command);
      const phase = "phase" in command.payload ? `/${command.payload.phase}` : "";
      const masumiNote = describeMasumiEnrichment(result.entry.event);
      console.log(`  [${result.entry.sequence}] ${command.kind}${phase}${masumiNote}`);
    }
  }

  const { artifact, replay, explainability } = await deps.explainabilityUseCase.execute(
    scenario.executionId,
  );
  console.log(
    `  replay: fidelity=${replay.fidelity} verification=${replay.verification.valid ? "PASSED" : "FAILED"}`,
  );
  console.log(
    `  explainability: outcome=${explainability.executionSummary.outcome} events=${explainability.executionSummary.eventCount}`,
  );

  const exportBytes = await deps.auditExportUseCase.execute(scenario.executionId, "json");
  const exportPath = join(outDir, `demo-${scenario.outputSlug}-audit-export.json`);
  writeFileSync(exportPath, Buffer.from(exportBytes));
  console.log(`  artifact rootHash: ${artifact.rootHash}`);
  console.log(`  audit export: ${exportPath} (${exportBytes.length} bytes)`);
}

async function main(): Promise<void> {
  const config = loadConfig();
  const deps = buildDependencies(config);
  const outDir = join(__dirname, "..", "..", "data");
  mkdirSync(outDir, { recursive: true });

  for (const scenario of SCENARIOS) {
    await runScenario(deps, scenario, outDir);
  }

  console.log(`\nAll ${SCENARIOS.length} demo scenarios seeded and verified.`);
  deps.close?.();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
