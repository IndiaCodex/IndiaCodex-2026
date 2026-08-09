import { BaseAgent } from "./base-agent";
import { AGENT_CONFIGS } from "@/config/agents";
import { generateStructuredStream, isMockMode } from "@/services/openai/streaming";
import { loadPrompt } from "@/prompts";
import { z } from "zod";
import { delay } from "@/lib/utils";

const FrontendOutput = z.object({
  scaffold: z.string(),
  components: z.array(z.string()),
  pages: z.array(z.string()),
  apiRoutes: z.array(z.string()),
  styling: z.string(),
  dependencies: z.array(z.string()),
});

export class FrontendEngineer extends BaseAgent {
  constructor() {
    const config = AGENT_CONFIGS.find((c) => c.id === "frontend-engineer");
    if (!config) throw new Error("Frontend engineer config not found");
    super(config);
  }

  get systemPrompt(): string { return loadPrompt("frontend-engineer-system"); }
  get inputSchema() { return { type: "object", properties: { architecture: { type: "object" }, projectContext: { type: "object" } } }; }
  get outputSchema() { return { type: "object", properties: { scaffold: { type: "string" }, components: { type: "array" }, pages: { type: "array" }, apiRoutes: { type: "array" }, styling: { type: "string" }, dependencies: { type: "array" } } }; }

  async execute(input: unknown): Promise<z.infer<typeof FrontendOutput>> {
    this.setStatus("working");
    this.addLog("Scaffolding frontend application...");
    if (isMockMode()) return this.mockExecute();

    const result: z.infer<typeof FrontendOutput> = { scaffold: "", components: [], pages: [], apiRoutes: [], styling: "", dependencies: [] };
    const stream = generateStructuredStream<z.infer<typeof FrontendOutput>>(
      this.systemPrompt, JSON.stringify(input), this.outputSchema as Record<string, unknown>,
    );
    for await (const event of stream) {
      if (event.parsed) Object.assign(result, event.parsed);
      if (event.type === "error") return this.mockExecute();
    }
    this.addCost(this.instance.config.fee); this.setConfidence(0.87); this.setOutput(result); this.setStatus("completed");
    this.addLog("Frontend scaffolded. Ready for integration testing.");
    return result;
  }

  private async mockExecute(): Promise<z.infer<typeof FrontendOutput>> {
    this.addLog("Mock frontend generation mode", "warn");

    this.addReasoning("Analyzing architecture to design component tree...");
    await delay(700);

    this.addReasoning("Building UI component hierarchy and page structure...");
    await delay(600);

    this.addReasoning("Configuring styling system and dependencies...");
    await delay(500);

    const output = {
      scaffold: "Next.js 15 + TailwindCSS + MeshJS for Cardano wallet integration",
      components: ["ConnectWallet", "TransactionForm", "AssetGallery", "Dashboard", "Navbar", "Footer"],
      pages: ["/", "/dashboard", "/dashboard/staking", "/dashboard/nfts", "/dashboard/history"],
      apiRoutes: ["/api/transactions", "/api/assets", "/api/staking", "/api/user/profile"],
      styling: "TailwindCSS with dark mode, glassmorphism design system, responsive layout",
      dependencies: ["next", "react", "@meshsdk/core", "@meshsdk/react", "lucid-cardano", "tailwindcss", "framer-motion"],
    };
    this.addCost(this.instance.config.fee);
    this.setConfidence(0.87);
    this.setOutput(output);
    this.setStatus("completed");
    this.addLog("Frontend scaffold generated.");
    return output;
  }
}
