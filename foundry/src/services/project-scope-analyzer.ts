import type { AgentRole } from "@/types/execution";
import type { Complexity, ProjectScopeAnalysis } from "@/types/project";
import {
  SCOPE_ANALYSIS_SCHEMA,
  SPECIALIST_AGENTS,
  normalizeSelectedAgents,
} from "@/config/agent-scope";
import { generateStructuredResponse } from "@/services/openai/client";
import { getClient } from "@/services/openai/shared";

export interface ScopeAnalysisInput {
  name: string;
  description: string;
  goal: string;
}

function heuristicAnalyze(input: ScopeAnalysisInput): ProjectScopeAnalysis {
  const text = `${input.name} ${input.description} ${input.goal}`.toLowerCase();
  const capabilities: string[] = [];
  const required = new Set<AgentRole>(["research", "architecture", "documentation-engineer", "deployment-engineer"]);

  for (const agent of SPECIALIST_AGENTS) {
    if (agent.capabilityKeywords.some((kw) => text.includes(kw))) {
      required.add(agent.role);
      capabilities.push(agent.label);
    }
  }

  const needsContracts =
    SPECIALIST_AGENTS.find((a) => a.role === "contract-engineer")!.capabilityKeywords.some((kw) =>
      text.includes(kw),
    );
  const needsFrontend =
    SPECIALIST_AGENTS.find((a) => a.role === "frontend-engineer")!.capabilityKeywords.some((kw) =>
      text.includes(kw),
    ) || text.includes("app") || text.includes("build");

  if (needsContracts) required.add("contract-engineer");
  if (needsFrontend || !needsContracts) required.add("frontend-engineer");

  if (needsContracts && (text.includes("security") || text.includes("audit") || text.length > 200)) {
    required.add("security-engineer");
  }

  if (text.includes("test") || text.includes("qa") || required.size > 5) {
    required.add("qa-engineer");
  }

  let complexity: Complexity = "moderate";
  if (required.size <= 5 && !needsContracts) complexity = "simple";
  if (needsContracts && required.has("security-engineer") && required.has("qa-engineer")) {
    complexity = "complex";
  }

  const agents = normalizeSelectedAgents([...required]);

  return {
    complexity,
    summary: `Detected a ${complexity} Cardano project focused on ${capabilities.slice(0, 4).join(", ") || "core product delivery"}.`,
    detectedCapabilities:
      capabilities.length > 0
        ? capabilities
        : ["Product scoping", "Architecture", "Delivery"],
    requiredAgents: agents,
    reasoning: "Heuristic analysis from project description keywords.",
    analyzedAt: Date.now(),
  };
}

export async function analyzeProjectScope(input: ScopeAnalysisInput): Promise<ProjectScopeAnalysis> {
  if (!getClient()) {
    return heuristicAnalyze(input);
  }

  const agentGuide = SPECIALIST_AGENTS.map(
    (a) => `- ${a.role}: ${a.description}`,
  ).join("\n");

  try {
    const result = await generateStructuredResponse<{
      complexity: Complexity;
      summary: string;
      detectedCapabilities: string[];
      requiredAgents: AgentRole[];
      reasoning: string;
    }>(
      `You are a product scoping engine for autonomous software companies on Cardano.

Given a project idea, decide the MINIMUM set of specialist agents required. Fewer agents = faster delivery.

Available specialists:
${agentGuide}

Rules:
- Always include: research, architecture, documentation-engineer, deployment-engineer
- Include contract-engineer ONLY if on-chain validators, tokens, NFTs, staking, governance, or smart contracts are needed
- Include frontend-engineer if any user-facing app, dashboard, or wallet UI is implied
- Include security-engineer only when smart contracts exist AND risk is non-trivial
- Include qa-engineer for moderate/complex builds or when quality/testing is mentioned
- complexity: simple (landing page / single feature), moderate (typical dApp), complex (DAO, DeFi, multi-contract)
- detectedCapabilities: plain-language capabilities (not a feature checklist the user picked)
- requiredAgents: minimum agent roles needed`,
      JSON.stringify(input),
      SCOPE_ANALYSIS_SCHEMA as unknown as Record<string, unknown>,
      { temperature: 0.3 },
    );

    return {
      complexity: result.complexity,
      summary: result.summary,
      detectedCapabilities: result.detectedCapabilities,
      requiredAgents: normalizeSelectedAgents(result.requiredAgents),
      reasoning: result.reasoning,
      analyzedAt: Date.now(),
    };
  } catch {
    return heuristicAnalyze(input);
  }
}