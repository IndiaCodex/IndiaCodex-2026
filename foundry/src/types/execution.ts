export type AgentRole =
  | "ceo"
  | "research"
  | "architecture"
  | "contract-engineer"
  | "frontend-engineer"
  | "security-engineer"
  | "qa-engineer"
  | "documentation-engineer"
  | "deployment-engineer";

export type AgentStatus =
  | "idle"
  | "waiting"
  | "planning"
  | "researching"
  | "working"
  | "reviewing"
  | "completed"
  | "failed";

export type ProjectStatus =
  | "draft"
  | "forging"
  | "executing"
  | "completed"
  | "failed";

export type ExecutionPhase =
  | "research"
  | "architecture"
  | "contracts"
  | "frontend"
  | "security"
  | "testing"
  | "documentation"
  | "deployment"
  | "completed";

export interface WorkflowNode {
  id: string;
  agentId: string;
  agentRole: AgentRole;
  label: string;
  status: AgentStatus;
  position: { x: number; y: number };
  dependencies: string[];
  phase: ExecutionPhase;
  confidence: number;
  duration: number;
  cost: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  status: "pending" | "active" | "completed" | "failed";
}

export interface ExecutionState {
  projectId: string;
  status: ProjectStatus;
  currentNodeId: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  startedAt: number | null;
  completedAt: number | null;
  totalCost: number;
  totalTokens: number;
  totalToolCalls: number;
}
