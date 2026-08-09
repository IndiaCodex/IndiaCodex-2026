import { BaseAgent } from "./base-agent";
import { AGENT_CONFIGS } from "@/config/agents";
import { generateStructuredStream, isMockMode } from "@/services/openai/streaming";
import { loadPrompt } from "@/prompts";
import { z } from "zod";
import { delay } from "@/lib/utils";

const QaOutput = z.object({
  testPlan: z.array(z.string()),
  testCases: z.array(z.string()),
  coverage: z.number(),
  recommendations: z.array(z.string()),
});

export class QAEngineer extends BaseAgent {
  constructor() {
    const config = AGENT_CONFIGS.find((c) => c.id === "qa-engineer");
    if (!config) throw new Error("QA engineer config not found");
    super(config);
  }

  get systemPrompt(): string { return loadPrompt("qa-engineer-system"); }
  get inputSchema() { return { type: "object", properties: { contracts: { type: "object" }, frontend: { type: "object" }, security: { type: "object" } } }; }
  get outputSchema() { return { type: "object", properties: { testPlan: { type: "array" }, testCases: { type: "array" }, coverage: { type: "number" }, recommendations: { type: "array" } } }; }

  async execute(input: unknown): Promise<z.infer<typeof QaOutput>> {
    this.setStatus("working");
    this.addLog("Creating comprehensive test plans...");
    if (isMockMode()) return this.mockExecute();

    const result: z.infer<typeof QaOutput> = { testPlan: [], testCases: [], coverage: 0, recommendations: [] };
    const stream = generateStructuredStream<z.infer<typeof QaOutput>>(
      this.systemPrompt, JSON.stringify(input), this.outputSchema as Record<string, unknown>,
    );
    for await (const event of stream) {
      if (event.parsed) Object.assign(result, event.parsed);
      if (event.type === "error") return this.mockExecute();
    }
    this.addCost(this.instance.config.fee); this.setConfidence(0.85); this.setOutput(result); this.setStatus("completed");
    this.addLog("Test plans created. Ready for documentation.");
    return result;
  }

  private async mockExecute(): Promise<z.infer<typeof QaOutput>> {
    this.addLog("Mock QA mode — building test plans...", "warn");

    this.addReasoning("Reviewing contract specifications and frontend requirements...");
    await delay(700);

    this.addReasoning("Designing comprehensive test plan covering all components...");
    await delay(600);

    this.addReasoning("Writing test cases and calculating coverage targets...");
    await delay(500);

    const output = {
      testPlan: ["Unit test all validator functions", "Integration test contract interactions", "Frontend component testing", "Wallet connection flow tests", "End-to-end transaction flow"],
      testCases: ["UTxO creation with valid datum", "Transaction with unauthorized signatory rejected", "Token minting within supply limits", "Staking deposit and withdrawal cycle"],
      coverage: 87,
      recommendations: ["Add property-based testing for edge cases", "Implement continuous integration for automated testing"],
    };
    this.addCost(this.instance.config.fee);
    this.setConfidence(0.86);
    this.setOutput(output);
    this.setStatus("completed");
    this.addLog("QA test plan generated.");
    return output;
  }
}
