import type { AgentStatus, AgentRole } from "./execution";

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdgeDef[];
}

export interface WorkflowNodeDef {
  id: string;
  agentRole: AgentRole;
  label: string;
  description: string;
  phase: string;
  dependencies: string[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface WorkflowEdgeDef {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface WorkflowExecutionContext {
  workflowId: string;
  projectId: string;
  projectContext: ProjectContext;
  nodeResults: Map<string, unknown>;
  currentNodeId: string | null;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
}

export interface ProjectContext {
  id: string;
  name: string;
  description: string;
  targetChain: string;
  complexity: string;
  goal: string;
  features: string[];
  requiredAgents: string[];
  scopeSummary?: string;
}

export interface ExecutionResult {
  nodeId: string;
  agentRole: AgentRole;
  status: AgentStatus;
  output: unknown;
  confidence: number;
  duration: number;
  cost: number;
  tokensUsed: number;
  toolCalls: number;
  error: string | null;
  reasoning: string[];
  logs: string[];
}

export type NodeExecutionFn = (
  input: unknown,
  context: WorkflowExecutionContext,
) => Promise<ExecutionResult>;
