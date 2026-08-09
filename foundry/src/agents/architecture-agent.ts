import { BaseAgent } from "./base-agent";
import { AGENT_CONFIGS } from "@/config/agents";
import { generateStructuredStream, isMockMode } from "@/services/openai/streaming";
import { loadPrompt } from "@/prompts";
import { z } from "zod";
import { delay } from "@/lib/utils";

const ArchitectureOutput = z.object({
  overview: z.string(),
  components: z.array(z.object({
    name: z.string(), description: z.string(), technology: z.string(), dependencies: z.array(z.string()),
  })),
  dataFlow: z.array(z.string()),
  folderStructure: z.array(z.string()),
});

export class ArchitectureAgent extends BaseAgent {
  constructor() {
    const config = AGENT_CONFIGS.find((c) => c.id === "architecture");
    if (!config) throw new Error("Architecture agent config not found");
    super(config);
  }

  get systemPrompt(): string { return loadPrompt("architecture-system"); }
  get inputSchema() { return { type: "object", properties: { research: this.outputSchema, projectContext: { type: "object" } } }; }
  get outputSchema() { return { type: "object", properties: { overview: { type: "string" }, components: { type: "array" }, dataFlow: { type: "array" }, folderStructure: { type: "array" } } }; }

  async execute(input: unknown): Promise<z.infer<typeof ArchitectureOutput>> {
    this.setStatus("working");
    this.addLog("Designing system architecture...");
    if (isMockMode()) return this.mockExecute();

    const result: z.infer<typeof ArchitectureOutput> = { overview: "", components: [], dataFlow: [], folderStructure: [] };
    const stream = generateStructuredStream<z.infer<typeof ArchitectureOutput>>(
      this.systemPrompt, JSON.stringify(input), this.outputSchema as Record<string, unknown>,
    );
    for await (const event of stream) {
      if (event.parsed) Object.assign(result, event.parsed);
      if (event.type === "error") return this.mockExecute();
    }
    this.addCost(this.instance.config.fee); this.setConfidence(0.9); this.setOutput(result); this.setStatus("completed");
    this.addLog("Architecture designed. Ready for contract and frontend engineers.");
    return result;
  }

  private async mockExecute(): Promise<z.infer<typeof ArchitectureOutput>> {
    this.addLog("Mock architecture mode — designing system...", "warn");

    this.addReasoning("Analyzing research outputs to design system architecture...");
    await delay(700);

    this.addReasoning("Defining component hierarchy and data flow between layers...");
    await delay(600);

    this.addReasoning("Structuring project folders for optimal developer experience...");
    await delay(500);

    const output = {
      overview: "Three-tier architecture: smart contracts (Aiken), backend API (Next.js), frontend (React/MeshJS)",
      components: [
        { name: "Smart Contracts", description: "Aiken-based validation and business logic", technology: "Aiken", dependencies: [] },
        { name: "API Layer", description: "Next.js API routes for off-chain data", technology: "Next.js", dependencies: [] },
        { name: "Frontend", description: "React SPA with wallet integration", technology: "Next.js + MeshJS", dependencies: ["API Layer"] },
      ],
      dataFlow: ["User connects wallet via Luc dApp Connector", "Frontend submits transactions via Cardano CLI", "Smart contracts validate and execute on-chain"],
      folderStructure: ["contracts/", "src/app/", "src/components/", "src/lib/", "src/hooks/", "public/", "tests/"],
    };
    this.addCost(this.instance.config.fee);
    this.setConfidence(0.85);
    this.setOutput(output);
    this.setStatus("completed");
    this.addLog("Architecture design completed.");
    return output;
  }
}
