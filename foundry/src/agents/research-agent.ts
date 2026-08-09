import { BaseAgent } from "./base-agent";
import { AGENT_CONFIGS } from "@/config/agents";
import { generateStructuredStream, isMockMode } from "@/services/openai/streaming";
import { loadPrompt } from "@/prompts";
import type { ResearchOutputSchema } from "@/schemas/agent-schemas";
import { z } from "zod";
import { delay } from "@/lib/utils";

const ResearchOutput = z.object({
  summary: z.string(),
  keyFindings: z.array(z.string()),
  technologies: z.array(z.string()),
  risks: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export class ResearchAgent extends BaseAgent {
  constructor() {
    const config = AGENT_CONFIGS.find((c) => c.id === "research");
    if (!config) throw new Error("Research agent config not found");
    super(config);
  }

  get systemPrompt(): string {
    return loadPrompt("research-system");
  }

  get inputSchema(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        projectName: { type: "string" },
        description: { type: "string" },
        goal: { type: "string" },
        features: { type: "array", items: { type: "string" } },
        complexity: { type: "string" },
        previousOutputs: { type: "object" },
      },
    };
  }

  get outputSchema(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        summary: { type: "string" },
        keyFindings: { type: "array", items: { type: "string" } },
        technologies: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
        recommendations: { type: "array", items: { type: "string" } },
      },
    };
  }

  async execute(input: unknown): Promise<z.infer<typeof ResearchOutput>> {
    this.setStatus("researching");
    this.addLog("Starting deep research on project domain...");

    if (isMockMode()) return this.mockExecute();

    this.addLog("Analyzing market, technologies, and risks with AI...");
    this.setStatus("working");

    const result: z.infer<typeof ResearchOutput> = {
      summary: "", keyFindings: [], technologies: [], risks: [], recommendations: [],
    };

    const stream = generateStructuredStream<z.infer<typeof ResearchOutput>>(
      this.systemPrompt, JSON.stringify(input), this.outputSchema as Record<string, unknown>,
    );

    for await (const event of stream) {
      if (event.parsed) Object.assign(result, event.parsed);
      if (event.type === "error") {
        this.addLog(`Research AI error: ${event.error}`, "error");
        return this.mockExecute();
      }
    }

    this.addCost(this.instance.config.fee);
    this.setConfidence(0.88);
    this.setOutput(result);
    this.setStatus("completed");
    this.addLog("Research completed. Findings ready for architect.");
    return result;
  }

  private async mockExecute(): Promise<z.infer<typeof ResearchOutput>> {
    this.addLog("Mock research mode", "warn");

    this.addReasoning("Analyzing Cardano ecosystem and project requirements...");
    await delay(700);

    this.addReasoning("Evaluating technologies and identifying potential risks...");
    await delay(600);

    this.addReasoning("Forming recommendations based on best practices...");
    await delay(500);

    const output = {
      summary: "Research complete. Identified key technologies and potential risks for Cardano dApp development.",
      keyFindings: [
        "Aiken is the recommended language for Cardano smart contracts due to its safety guarantees",
        "Cardano's eUTXO model provides unique security advantages for DeFi applications",
        "CIP standards should be followed for token and NFT implementations",
      ],
      technologies: ["Aiken", "Cardano CLI", "Blockfrost API", "MeshJS SDK", "Luc dApp Connector"],
      risks: ["Smart contract vulnerabilities in complex validation logic", "Timing constraints on Cardano transaction submission", "Liquidity considerations for DeFi protocols"],
      recommendations: ["Use Aiken for contract development", "Implement thorough testing on preprod testnet", "Design for upgradeability from the start"],
    };
    this.addCost(this.instance.config.fee);
    this.setConfidence(0.88);
    this.setOutput(output);
    this.setStatus("completed");
    this.addLog("Research completed successfully.");
    return output;
  }
}
