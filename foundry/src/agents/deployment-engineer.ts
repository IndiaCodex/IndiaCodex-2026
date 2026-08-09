import { BaseAgent } from "./base-agent";
import { AGENT_CONFIGS } from "@/config/agents";
import { generateStructuredStream, isMockMode } from "@/services/openai/streaming";
import { loadPrompt } from "@/prompts";
import { z } from "zod";
import { delay } from "@/lib/utils";

const DeployOutput = z.object({
  checklist: z.array(z.string()),
  steps: z.array(z.object({ order: z.number(), name: z.string(), description: z.string(), command: z.string().optional() })),
  configuration: z.record(z.string(), z.unknown()),
  verificationSteps: z.array(z.string()),
});

export class DeploymentEngineer extends BaseAgent {
  constructor() {
    const config = AGENT_CONFIGS.find((c) => c.id === "deployment-engineer");
    if (!config) throw new Error("Deployment engineer config not found");
    super(config);
  }

  get systemPrompt(): string { return loadPrompt("deployment-engineer-system"); }
  get inputSchema() { return { type: "object", properties: { allOutputs: { type: "object" } } }; }
  get outputSchema() { return { type: "object", properties: { checklist: { type: "array" }, steps: { type: "array" }, configuration: { type: "object" }, verificationSteps: { type: "array" } } }; }

  async execute(input: unknown): Promise<z.infer<typeof DeployOutput>> {
    this.setStatus("working");
    this.addLog("Preparing deployment plan for Cardano preprod...");
    const inp = input as { walletAddress?: string };
    if (isMockMode()) return this.mockExecute(inp);

    const result: z.infer<typeof DeployOutput> = { checklist: [], steps: [], configuration: {}, verificationSteps: [] };
    const stream = generateStructuredStream<z.infer<typeof DeployOutput>>(
      this.systemPrompt, JSON.stringify(input), this.outputSchema as Record<string, unknown>,
    );
    for await (const event of stream) {
      if (event.parsed) Object.assign(result, event.parsed);
      if (event.type === "error") return this.mockExecute(inp);
    }
    this.addCost(this.instance.config.fee); this.setConfidence(0.88); this.setOutput(result); this.setStatus("completed");
    this.addLog("Deployment plan ready. Company execution complete.");
    return result;
  }

  private mockExecute(input?: { walletAddress?: string }) {
    const walletAddr = input?.walletAddress || "addr_test1...";
    this.addLog("Mock deployment mode", "warn");
    this.addCost(this.instance.config.fee);

    const deployCmd = walletAddr.startsWith("addr_test")
      ? `Deploy to preprod using wallet ${walletAddr.slice(0, 8)}...${walletAddr.slice(-6)}`
      : "cardano-cli transaction submit --testnet-magic 1";

    return {
      checklist: [
        "Contracts compiled with aiken build",
        "Tests passing on preprod",
        "Frontend build successful",
        "Environment variables configured",
        `Wallet connected: ${walletAddr.slice(0, 8)}...${walletAddr.slice(-6)}`,
        "Wallet funded with test ADA",
      ],
      steps: [
        { order: 1, name: "Compile Contracts", description: "Build Aiken contracts", command: "aiken build" },
        { order: 2, name: "Deploy Contracts", description: deployCmd, command: "wallet-sign --network preprod" },
        { order: 3, name: "Deploy Frontend", description: "Deploy Next.js app to Vercel", command: "vercel --prod" },
        { order: 4, name: "Verify", description: "Verify all components are operational" },
      ],
      configuration: {
        network: "preprod",
        walletAddress: walletAddr,
        contractAddress: `${walletAddr.slice(0, 8)}...${walletAddr.slice(-6)}`,
        apiUrl: "https://api.project.com",
        blockfrostProjectId: "mainnetXXX",
      },
      verificationSteps: [
        "Check contract on block explorer",
        "Test wallet connection",
        "Execute test transaction via connected wallet",
        "Verify frontend loads correctly",
      ],
    };
  }
}
