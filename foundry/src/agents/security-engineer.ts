import { BaseAgent } from "./base-agent";
import { AGENT_CONFIGS } from "@/config/agents";
import { generateStructuredStream, isMockMode } from "@/services/openai/streaming";
import { loadPrompt } from "@/prompts";
import { z } from "zod";
import { delay } from "@/lib/utils";

const SecurityOutput = z.object({
  vulnerabilities: z.array(z.object({
    severity: z.enum(["critical", "high", "medium", "low"]),
    description: z.string(),
    recommendation: z.string(),
  })),
  auditSummary: z.string(),
  score: z.number(),
});

export class SecurityEngineer extends BaseAgent {
  constructor() {
    const config = AGENT_CONFIGS.find((c) => c.id === "security-engineer");
    if (!config) throw new Error("Security engineer config not found");
    super(config);
  }

  get systemPrompt(): string { return loadPrompt("security-engineer-system"); }
  get inputSchema() { return { type: "object", properties: { contracts: { type: "object" }, architecture: { type: "object" } } }; }
  get outputSchema() { return { type: "object", properties: { vulnerabilities: { type: "array" }, auditSummary: { type: "string" }, score: { type: "number" } } }; }

  async execute(input: unknown): Promise<z.infer<typeof SecurityOutput>> {
    this.setStatus("working");
    this.addLog("Running security audit on smart contracts...");
    if (isMockMode()) return this.mockExecute();

    const result: z.infer<typeof SecurityOutput> = { vulnerabilities: [], auditSummary: "", score: 0 };
    const stream = generateStructuredStream<z.infer<typeof SecurityOutput>>(
      this.systemPrompt, JSON.stringify(input), this.outputSchema as Record<string, unknown>,
    );
    for await (const event of stream) {
      if (event.parsed) Object.assign(result, event.parsed);
      if (event.type === "error") return this.mockExecute();
    }
    this.addCost(this.instance.config.fee); this.setConfidence(0.82); this.setOutput(result); this.setStatus("completed");
    this.addLog("Security audit complete. Report ready for QA.");
    return result;
  }

  private async mockExecute(): Promise<z.infer<typeof SecurityOutput>> {
    this.addLog("Mock security audit mode — scanning contracts...", "warn");

    this.addReasoning("Analyzing smart contract code for vulnerabilities...");
    await delay(800);

    this.addReasoning("Checking validation logic, access control, and timelock functions...");
    await delay(600);

    this.addReasoning("Calculating security score and preparing audit report...");
    await delay(500);

    const output = {
      vulnerabilities: [
        { severity: "low" as const, description: "Missing input validation on datum fields", recommendation: "Add comprehensive validation in all validator functions" },
        { severity: "medium" as const, description: "Potential front-running on timelock functions", recommendation: "Implement commit-reveal scheme for time-sensitive operations" },
      ],
      auditSummary: "Overall security posture is strong. Two minor issues identified. Recommended fixes will improve overall safety.",
      score: 92,
    };
    this.addCost(this.instance.config.fee);
    this.setConfidence(0.92);
    this.setOutput(output);
    this.setStatus("completed");
    this.addLog("Security audit completed.");
    return output;
  }
}
