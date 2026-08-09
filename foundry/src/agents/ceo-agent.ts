import { BaseAgent } from "./base-agent";
import { AGENT_CONFIGS } from "@/config/agents";
import { generateStructuredStream, isMockMode } from "@/services/openai/streaming";
import { loadPrompt } from "@/prompts";
import { buildExecutionDag } from "@/services/execution-plan";
import type { AgentRole } from "@/types/execution";
import { delay } from "@/lib/utils";

export interface CEOOutput {
  projectSummary: string;
  taskBreakdown: string[];
  assignments: Record<string, string>;
  reviewComments: Record<string, string>;
  finalSummary: string;
  qualityScore: number;
  dynamicDag: Array<{
    id: string;
    agentRole: string;
    label: string;
    dependencies: string[];
    phase: string;
  }>;
}

interface CEOInput {
  projectName?: string;
  description?: string;
  goal?: string;
  features?: string[];
  complexity?: string;
  requiredAgents?: string[];
  scopeSummary?: string;
}

export class CEOAgent extends BaseAgent {
  constructor() {
    const config = AGENT_CONFIGS.find((c) => c.id === "ceo");
    if (!config) throw new Error("CEO agent config not found");
    super(config);
  }

  get systemPrompt(): string {
    return loadPrompt("ceo-system");
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
      },
    };
  }

  get outputSchema(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        projectSummary: { type: "string" },
        taskBreakdown: { type: "array", items: { type: "string" } },
        assignments: { type: "object" },
        reviewComments: { type: "object" },
        finalSummary: { type: "string" },
        qualityScore: { type: "number" },
        dynamicDag: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              agentRole: { type: "string" },
              label: { type: "string" },
              dependencies: { type: "array", items: { type: "string" } },
              phase: { type: "string" },
            },
          },
        },
      },
    };
  }

  async execute(input: unknown): Promise<CEOOutput> {
    const ceoInput = input as CEOInput;
    this.setStatus("planning");
    this.addLog("Analyzing project requirements...");
    this.addReasoning("Reading project brief and identifying scope");

    if (ceoInput.requiredAgents?.length) {
      return this.planFromScope(ceoInput);
    }

    if (isMockMode()) {
      return await this.mockExecute(ceoInput);
    }

    this.addLog("Decomposing project into tasks using AI...");
    this.setStatus("working");

    const result: CEOOutput = {
      projectSummary: "",
      taskBreakdown: [],
      assignments: {},
      reviewComments: {},
      finalSummary: "",
      qualityScore: 0,
      dynamicDag: [],
    };

    const stream = generateStructuredStream<CEOOutput>(
      this.systemPrompt,
      JSON.stringify(input),
      this.outputSchema as Record<string, unknown>,
    );

    for await (const event of stream) {
      if (event.type === "text" && event.content) {
        this.addReasoning(event.content.slice(0, 200));
      }
      if (event.parsed) {
        Object.assign(result, event.parsed);
      }
      if (event.type === "error") {
        this.addLog(`OpenAI error: ${event.error}`, "error");
        return this.mockExecute(input as CEOInput);
      }
    }

    this.addCost(this.instance.config.fee);
    this.setConfidence(result.qualityScore / 100 || 0.85);
    this.setOutput(result);
    this.setStatus("completed");
    this.addLog("Project analyzed. DAG generated. Delegating to specialists.");

    return result;
  }

  /** Use pre-analyzed scope from project creation — skips a redundant CEO LLM call. */
  private async planFromScope(input: CEOInput): Promise<CEOOutput> {
    this.setStatus("working");
    this.addLog("Using AI scope analysis from project brief...");
    this.addReasoning(input.scopeSummary || "Scope already analyzed during project creation.");

    const complexity = input.complexity || "moderate";
    const requiredAgents = (input.requiredAgents ?? []) as AgentRole[];
    const dag = buildExecutionDag(requiredAgents);

    this.addReasoning(
      `${complexity} project — orchestrating ${dag.length} specialists in parallel where possible.`,
    );

    const output: CEOOutput = {
      projectSummary:
        input.scopeSummary ||
        `Project "${input.projectName || "Untitled"}" — ${input.goal || "Cardano build"}.`,
      taskBreakdown: dag.map(
        (n) =>
          `${n.label}: ${n.dependencies.length > 0 ? `after ${n.dependencies.map((d) => d.replace("-node", "")).join(", ")}` : "start"}`,
      ),
      assignments: Object.fromEntries(dag.map((n) => [n.agentRole, n.label])),
      reviewComments: {},
      finalSummary: "Execution plan ready. Delegating to the tailored specialist roster.",
      qualityScore: 0.9,
      dynamicDag: dag,
    };

    this.addCost(this.instance.config.fee * 0.25);
    this.setConfidence(0.9);
    this.setOutput(output);
    this.setStatus("completed");
    this.addLog(`DAG ready (${dag.length} nodes). Starting specialists.`);

    return output;
  }

  private async mockExecute(input: CEOInput): Promise<CEOOutput> {
    this.addLog("Mock AI — set OPENAI_API_KEY for real execution", "warn");
    this.setStatus("working");

    this.addReasoning("Reading project requirements and identifying scope...");
    await delay(800);

    this.addReasoning("Analyzing complexity and breaking into phases...");
    await delay(600);

    const complexity = input?.complexity || "moderate";
    const requiredAgents = (input?.requiredAgents ?? []) as AgentRole[];
    const dag = buildExecutionDag(requiredAgents);

    this.addReasoning(
      `Project complexity: ${complexity}. Running ${dag.length} specialists (not full roster).`,
    );
    await delay(400);

    this.addReasoning("Assigning specialist agents to tasks...");
    await delay(500);

    const output: CEOOutput = {
      projectSummary:
        input?.scopeSummary ||
        `Project "${input?.projectName || "Untitled"}" analyzed.` +
          ` Goal: ${input?.goal || "Build a Cardano dApp"}.` +
          ` Complexity: ${complexity}. Capabilities: ${(input?.features || []).join(", ")}`,
      taskBreakdown: dag.map((n) => `${n.label}: ${n.dependencies.length > 0 ? `after ${n.dependencies.map(d => d.replace("-node", "")).join(", ")}` : "start"}`),
      assignments: Object.fromEntries(dag.map((n) => [n.agentRole, n.label])),
      reviewComments: {},
      finalSummary: "All tasks have been assigned. The autonomous software company is now operational.",
      qualityScore: 0.92,
      dynamicDag: dag,
    };

    this.addCost(this.instance.config.fee);
    this.setConfidence(0.92);
    this.setOutput(output);
    this.setStatus("completed");
    this.addLog("DAG ready. Delegating to specialist agents.");

    return output;
  }
}
