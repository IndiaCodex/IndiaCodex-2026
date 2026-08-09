import type { ProjectStatus, AgentRole } from "./execution";
import type { CompanySummary } from "./company";

export type Complexity = "simple" | "moderate" | "complex";
export type TargetChain = "cardano";

export interface ProjectScopeAnalysis {
  complexity: Complexity;
  summary: string;
  detectedCapabilities: string[];
  requiredAgents: AgentRole[];
  reasoning: string;
  analyzedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  targetChain: TargetChain;
  complexity: Complexity;
  goal: string;
  features: string[];
  scopeAnalysis: ProjectScopeAnalysis | null;
  requiredAgents: AgentRole[];
  status: ProjectStatus;
  companyId: string | null;
  summary: CompanySummary | null;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectFormData {
  name: string;
  description: string;
  targetChain: TargetChain;
  goal: string;
  scopeAnalysis: ProjectScopeAnalysis | null;
}

export interface ProjectOutput {
  id: string;
  projectId: string;
  type: string;
  title: string;
  content: string;
  mimeType: string;
  createdAt: number;
  sourceAgentRole?: AgentRole;
}

export const PROJECT_FORM_DEFAULTS: ProjectFormData = {
  name: "",
  description: "",
  targetChain: "cardano",
  goal: "",
  scopeAnalysis: null,
};

export const DEMO_PROJECT: ProjectFormData = {
  name: "Cardano DeFi Governance",
  description:
    "A decentralized governance platform for Cardano DeFi protocols. DAO voting, treasury management, and proposal system with real-time analytics.",
  targetChain: "cardano",
  goal:
    "Build a complete DAO governance dApp with voting, proposal creation, treasury management, and on-chain execution via smart contracts. Users stake governance tokens to vote on proposals.",
  scopeAnalysis: null,
};

export const AGENT_CREATION_ORDER: AgentRole[] = [
  "ceo",
  "research",
  "architecture",
  "contract-engineer",
  "frontend-engineer",
  "security-engineer",
  "qa-engineer",
  "documentation-engineer",
  "deployment-engineer",
];
