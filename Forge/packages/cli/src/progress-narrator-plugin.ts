import type { ForgePlugin, PluginContext } from "@forge/plugin-api";

/**
 * Turns the platform's existing lifecycle hooks into live CLI narration.
 * Deliberately just a plugin like any other — it adds no new hook types,
 * it only listens to the ones already fired by ScaffoldProject, Compile,
 * RunTests, and Deploy.
 */
export function createProgressNarratorPlugin(): ForgePlugin {
  return {
    name: "forge-cli-progress-narrator",
    version: "0.0.0",
    register: (context: PluginContext) => {
      context.onHook("onProjectInit", ({ project }) => {
        console.log(`→ Scaffolded ${project.name}`);
      });
      context.onHook("beforeCompile", () => {
        console.log("→ Compiling with the real Aiken compiler...");
      });
      context.onHook("afterCompile", ({ blueprint }) => {
        console.log(
          `  compiled ${blueprint.validators.length} validator(s) — CIP-57 blueprint parsed`,
        );
      });
      context.onHook("onSdkGenerated", () => {
        console.log("→ Generated the typed TypeScript SDK");
      });
      context.onHook("beforeTest", () => {
        console.log("→ Running tests against the in-memory emulator...");
      });
      context.onHook("afterTest", ({ report }) => {
        console.log(`  ${report.passedCount} passed, ${report.failedCount} failed`);
      });
      context.onHook("beforeDeploy", ({ network }) => {
        console.log(`→ Computing the deployment address on ${network}...`);
      });
      context.onHook("afterDeploy", ({ manifest }) => {
        console.log(`  address: ${manifest.address}`);
      });
    },
  };
}
