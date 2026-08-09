import type { AgentRole } from "@/types/execution";

export interface AgentScopeMeta {
  role: AgentRole;
  label: string;
  phase: string;
  description: string;
  /** Plain-language tooltip shown in the agent picker. */
  tooltip: string;
  capabilityKeywords: string[];
}

/** Always included — execution cannot start without these. */
export const CORE_AGENT_ROLES: AgentRole[] = ["research", "architecture"];

/** Specialist agents the CEO can delegate to (CEO always runs separately). */
export const SPECIALIST_AGENTS: AgentScopeMeta[] = [
  {
    role: "research",
    label: "Research",
    phase: "research",
    description: "Requirements, market context, and technical constraints",
    tooltip:
      "Reads your brief and produces requirements, user stories, and Cardano ecosystem context before any building starts.",
    capabilityKeywords: [],
  },
  {
    role: "architecture",
    label: "Architecture",
    phase: "architecture",
    description: "System design, data flow, and component boundaries",
    tooltip:
      "Designs how the product fits together — on-chain vs off-chain, data flow, APIs, and what each specialist will build.",
    capabilityKeywords: [],
  },
  {
    role: "contract-engineer",
    label: "Smart Contracts",
    phase: "contracts",
    description: "Aiken/Plutus validators, minting, vesting, governance logic",
    tooltip:
      "Writes Aiken smart contracts — validators, minting policies, vesting, DAO logic, and on-chain state machines.",
    capabilityKeywords: [
      "smart contract",
      "validator",
      "aiken",
      "plutus",
      "mint",
      "nft",
      "token",
      "vesting",
      "staking",
      "governance",
      "dao",
      "on-chain",
      "multi-sig",
      "oracle",
      "payment splitter",
      "time-lock",
      "vault",
    ],
  },
  {
    role: "frontend-engineer",
    label: "Frontend",
    phase: "frontend",
    description: "Next.js UI, wallet connect, dashboards",
    tooltip:
      "Builds the user-facing app — wallet connection, pages, dashboards, and the interface that talks to your contracts.",
    capabilityKeywords: [
      "frontend",
      "ui",
      "dapp",
      "dashboard",
      "wallet connect",
      "website",
      "landing",
      "interface",
      "user-facing",
    ],
  },
  {
    role: "security-engineer",
    label: "Security",
    phase: "security",
    description: "Threat modeling and contract security review",
    tooltip:
      "Reviews contracts and architecture for vulnerabilities, attack paths, and Cardano-specific security risks.",
    capabilityKeywords: [
      "security",
      "audit",
      "exploit",
      "vulnerability",
      "formal verification",
    ],
  },
  {
    role: "qa-engineer",
    label: "QA & Testing",
    phase: "testing",
    description: "Test plans, integration coverage, acceptance criteria",
    tooltip:
      "Creates test plans, integration checks, and acceptance criteria so outputs are verified before delivery.",
    capabilityKeywords: ["test", "qa", "quality", "e2e", "integration test"],
  },
  {
    role: "documentation-engineer",
    label: "Documentation",
    phase: "documentation",
    description: "README, API docs, deployment notes",
    tooltip:
      "Produces README, setup guides, API notes, and handoff docs so others can run and extend the project.",
    capabilityKeywords: ["documentation", "readme", "docs", "guide"],
  },
  {
    role: "deployment-engineer",
    label: "Deployment",
    phase: "deployment",
    description: "Preprod deployment plan and release checklist",
    tooltip:
      "Plans preprod deployment, release steps, env config, and a checklist to ship on Cardano testnet.",
    capabilityKeywords: ["deploy", "release", "ci/cd", "pipeline"],
  },
];

export const ALL_SPECIALIST_ROLES = SPECIALIST_AGENTS.map((a) => a.role);

export function getAgentMeta(role: AgentRole): AgentScopeMeta | undefined {
  return SPECIALIST_AGENTS.find((a) => a.role === role);
}

/** Order agents for display and execution; enforce core + doc-before-deploy rules. */
export function normalizeSelectedAgents(agents: AgentRole[]): AgentRole[] {
  const valid = new Set(ALL_SPECIALIST_ROLES);
  const picked = agents.filter((r) => valid.has(r));
  const unique = [...new Set(picked)];

  for (const core of CORE_AGENT_ROLES) {
    if (!unique.includes(core)) unique.unshift(core);
  }

  if (unique.includes("deployment-engineer") && !unique.includes("documentation-engineer")) {
    unique.push("documentation-engineer");
  }

  return SPECIALIST_AGENTS.map((a) => a.role).filter((r) => unique.includes(r));
}

export const SCOPE_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    complexity: { type: "string", enum: ["simple", "moderate", "complex"] },
    summary: { type: "string" },
    detectedCapabilities: { type: "array", items: { type: "string" } },
    requiredAgents: {
      type: "array",
      items: {
        type: "string",
        enum: ALL_SPECIALIST_ROLES,
      },
    },
    reasoning: { type: "string" },
  },
  required: ["complexity", "summary", "detectedCapabilities", "requiredAgents", "reasoning"],
} as const;