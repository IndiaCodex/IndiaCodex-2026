import { BaseAgent } from "./base-agent";
import { AGENT_CONFIGS } from "@/config/agents";
import { generateStructuredStream, isMockMode } from "@/services/openai/streaming";
import { loadPrompt } from "@/prompts";
import { z } from "zod";
import { delay } from "@/lib/utils";

const DocOutput = z.object({
  readme: z.string(),
  technicalDocs: z.string(),
  apiDocs: z.string(),
  deploymentGuide: z.string(),
  developerNotes: z.string(),
  catalystProposal: z.string(),
});

export class DocumentationEngineer extends BaseAgent {
  constructor() {
    const config = AGENT_CONFIGS.find((c) => c.id === "documentation-engineer");
    if (!config) throw new Error("Documentation engineer config not found");
    super(config);
  }

  get systemPrompt(): string { return loadPrompt("documentation-engineer-system"); }
  get inputSchema() { return { type: "object", properties: { allOutputs: { type: "object" } } }; }
  get outputSchema() { return { type: "object", properties: { readme: { type: "string" }, technicalDocs: { type: "string" }, apiDocs: { type: "string" }, deploymentGuide: { type: "string" }, developerNotes: { type: "string" }, catalystProposal: { type: "string" } } }; }

  async execute(input: unknown): Promise<z.infer<typeof DocOutput>> {
    this.setStatus("working");
    this.addLog("Writing comprehensive documentation...");
    if (isMockMode()) return this.mockExecute();

    const result: z.infer<typeof DocOutput> = { readme: "", technicalDocs: "", apiDocs: "", deploymentGuide: "", developerNotes: "", catalystProposal: "" };
    const stream = generateStructuredStream<z.infer<typeof DocOutput>>(
      this.systemPrompt, JSON.stringify(input), this.outputSchema as Record<string, unknown>,
    );
    for await (const event of stream) {
      if (event.parsed) Object.assign(result, event.parsed);
      if (event.type === "error") return this.mockExecute();
    }
    this.addCost(this.instance.config.fee); this.setConfidence(0.9); this.setOutput(result); this.setStatus("completed");
    this.addLog("Documentation complete. Ready for deployment.");
    return result;
  }

  private mockExecute() {
    this.addLog("Mock documentation mode", "warn");
    this.addCost(this.instance.config.fee);
    return {
      readme: "# Project Name\n\nA Cardano dApp built by Foundry's autonomous AI company.\n\n## Getting Started\n\n...",
      technicalDocs: "## Architecture\n\nThree-tier architecture using Aiken contracts, Next.js API, React frontend.\n\n...",
      apiDocs: "## API Endpoints\n\n### POST /api/transactions\n\nSubmit a transaction.\n\n...",
      deploymentGuide: "## Deployment\n\n### Prerequisites\n- Cardano CLI installed\n- Preprod testnet access\n\n...",
      developerNotes: "## Developer Notes\n\n- Use `aiken build` to compile contracts\n- Run `npm run dev` for frontend\n\n...",
      catalystProposal: "# Project Catalyst Proposal\n\n## Abstract\n\nBuilding an autonomous software company on Cardano...\n\n## Budget\n\n...",
    };
  }
}
