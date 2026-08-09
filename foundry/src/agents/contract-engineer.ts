import { BaseAgent } from "./base-agent";
import { AGENT_CONFIGS } from "@/config/agents";
import { generateStructuredStream, isMockMode } from "@/services/openai/streaming";
import { loadPrompt } from "@/prompts";
import { z } from "zod";
import { delay } from "@/lib/utils";

const ContractOutput = z.object({
  contracts: z.array(z.object({
    name: z.string(), language: z.string(), code: z.string(), tests: z.string(), description: z.string(),
  })),
  validationRules: z.array(z.string()),
  deploymentPlan: z.string(),
});

export class ContractEngineer extends BaseAgent {
  constructor() {
    const config = AGENT_CONFIGS.find((c) => c.id === "contract-engineer");
    if (!config) throw new Error("Contract engineer config not found");
    super(config);
  }

  get systemPrompt(): string { return loadPrompt("contract-engineer-system"); }
  get inputSchema() { return { type: "object", properties: { architecture: { type: "object" }, projectContext: { type: "object" } } }; }
  get outputSchema() { return { type: "object", properties: { contracts: { type: "array" }, validationRules: { type: "array" }, deploymentPlan: { type: "string" } } }; }

  async execute(input: unknown): Promise<z.infer<typeof ContractOutput>> {
    this.setStatus("working");
    this.addLog("Developing Aiken smart contracts...");
    if (isMockMode()) return this.mockExecute();

    const result: z.infer<typeof ContractOutput> = { contracts: [], validationRules: [], deploymentPlan: "" };
    const stream = generateStructuredStream<z.infer<typeof ContractOutput>>(
      this.systemPrompt, JSON.stringify(input), this.outputSchema as Record<string, unknown>,
    );
    for await (const event of stream) {
      if (event.parsed) Object.assign(result, event.parsed);
      if (event.type === "error") return this.mockExecute();
    }
    this.addCost(this.instance.config.fee); this.setConfidence(0.85); this.setOutput(result); this.setStatus("completed");
    this.addLog("Smart contracts developed. Ready for security review.");
    return result;
  }

  private async mockExecute(): Promise<z.infer<typeof ContractOutput>> {
    this.addLog("Mock contract development mode", "warn");

    this.addReasoning("Designing smart contract architecture for eUTXO model...");
    await delay(800);

    this.addReasoning("Writing validation logic with owner-based access control...");
    await delay(700);

    this.addReasoning("Preparing test cases and deployment plan...");
    await delay(500);

    const output = {
      contracts: [{
        name: "main.ak",
        language: "Aiken",
        code: `use aiken/transaction.{Transaction}\nuse aiken/collection.{dict}\n\npub type Datum {\n  owner: Address,\n}\n\npub type Redeemer {\n  action: String,\n}\n\npub fn spend(datum: Datum, redeemer: Redeemer, tx: Transaction) -> Bool {\n  expect Some(tx_signed_by(tx, datum.owner))\n  True\n}`,
        tests: `test spend_with_owner_succeeds {\n  // Test logic here\n}`,
        description: "Main validator contract with owner-based access control",
      }],
      validationRules: ["Only owner can spend", "Two-key approval for admin functions", "Timelock on withdrawal functions"],
      deploymentPlan: "1. Build with `aiken build`\n2. Test with `aiken test`\n3. Deploy to preprod with Cardano CLI\n4. Verify with block explorer",
    };
    this.addCost(this.instance.config.fee);
    this.setConfidence(0.85);
    this.setOutput(output);
    this.setStatus("completed");
    this.addLog("Smart contracts developed and ready for review.");
    return output;
  }
}
