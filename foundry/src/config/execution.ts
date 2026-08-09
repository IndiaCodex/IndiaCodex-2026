import type { ExecutionPhase, WorkflowNode, WorkflowEdge } from "@/types/execution";

export const EXECUTION_PHASES: ExecutionPhase[] = [
  "research",
  "architecture",
  "contracts",
  "frontend",
  "security",
  "testing",
  "documentation",
  "deployment",
  "completed",
];

export const PHASE_LABELS: Record<ExecutionPhase, string> = {
  research: "Research",
  architecture: "Architecture",
  contracts: "Smart Contracts",
  frontend: "Frontend",
  security: "Security",
  testing: "Testing",
  documentation: "Documentation",
  deployment: "Deployment",
  completed: "Completed",
};

export const EXECUTION_SPEEDS = {
  slow: { minDelay: 2000, maxDelay: 4000 },
  normal: { minDelay: 1000, maxDelay: 2000 },
  fast: { minDelay: 300, maxDelay: 800 },
  instant: { minDelay: 0, maxDelay: 0 },
} as const;

export type ExecutionSpeed = keyof typeof EXECUTION_SPEEDS;

export const DEFAULT_EXECUTION_SPEED: ExecutionSpeed = "normal";

export const COST_PER_TOKEN = 0.000002;
export const COST_PER_TOOL_CALL = 0.0001;
export const BASE_AGENT_FEE = 100_000;

export const getExecutionNodes = (projectId: string): WorkflowNode[] => [
  {
    id: `${projectId}-research`,
    agentId: "research",
    agentRole: "research",
    label: "Research",
    status: "waiting",
    position: { x: 250, y: 0 },
    dependencies: [],
    phase: "research",
    confidence: 0,
    duration: 0,
    cost: 0,
  },
  {
    id: `${projectId}-architecture`,
    agentId: "architecture",
    agentRole: "architecture",
    label: "Architecture",
    status: "waiting",
    position: { x: 250, y: 120 },
    dependencies: [`${projectId}-research`],
    phase: "architecture",
    confidence: 0,
    duration: 0,
    cost: 0,
  },
  {
    id: `${projectId}-contracts`,
    agentId: "contract-engineer",
    agentRole: "contract-engineer",
    label: "Smart Contracts",
    status: "waiting",
    position: { x: 250, y: 240 },
    dependencies: [`${projectId}-architecture`],
    phase: "contracts",
    confidence: 0,
    duration: 0,
    cost: 0,
  },
  {
    id: `${projectId}-frontend`,
    agentId: "frontend-engineer",
    agentRole: "frontend-engineer",
    label: "Frontend",
    status: "waiting",
    position: { x: 250, y: 360 },
    dependencies: [`${projectId}-architecture`],
    phase: "frontend",
    confidence: 0,
    duration: 0,
    cost: 0,
  },
  {
    id: `${projectId}-security`,
    agentId: "security-engineer",
    agentRole: "security-engineer",
    label: "Security",
    status: "waiting",
    position: { x: 250, y: 480 },
    dependencies: [`${projectId}-contracts`],
    phase: "security",
    confidence: 0,
    duration: 0,
    cost: 0,
  },
  {
    id: `${projectId}-testing`,
    agentId: "qa-engineer",
    agentRole: "qa-engineer",
    label: "QA & Testing",
    status: "waiting",
    position: { x: 250, y: 600 },
    dependencies: [`${projectId}-contracts`, `${projectId}-frontend`],
    phase: "testing",
    confidence: 0,
    duration: 0,
    cost: 0,
  },
  {
    id: `${projectId}-documentation`,
    agentId: "documentation-engineer",
    agentRole: "documentation-engineer",
    label: "Documentation",
    status: "waiting",
    position: { x: 250, y: 720 },
    dependencies: [`${projectId}-testing`],
    phase: "documentation",
    confidence: 0,
    duration: 0,
    cost: 0,
  },
  {
    id: `${projectId}-deployment`,
    agentId: "deployment-engineer",
    agentRole: "deployment-engineer",
    label: "Deployment",
    status: "waiting",
    position: { x: 250, y: 840 },
    dependencies: [`${projectId}-documentation`],
    phase: "deployment",
    confidence: 0,
    duration: 0,
    cost: 0,
  },
];

export const getExecutionEdges = (projectId: string): WorkflowEdge[] => [
  { id: `${projectId}-edge-1`, source: `${projectId}-research`, target: `${projectId}-architecture`, status: "pending" },
  { id: `${projectId}-edge-2`, source: `${projectId}-architecture`, target: `${projectId}-contracts`, status: "pending" },
  { id: `${projectId}-edge-3`, source: `${projectId}-architecture`, target: `${projectId}-frontend`, status: "pending" },
  { id: `${projectId}-edge-4`, source: `${projectId}-contracts`, target: `${projectId}-security`, status: "pending" },
  { id: `${projectId}-edge-5`, source: `${projectId}-contracts`, target: `${projectId}-testing`, status: "pending" },
  { id: `${projectId}-edge-6`, source: `${projectId}-frontend`, target: `${projectId}-testing`, status: "pending" },
  { id: `${projectId}-edge-7`, source: `${projectId}-testing`, target: `${projectId}-documentation`, status: "pending" },
  { id: `${projectId}-edge-8`, source: `${projectId}-documentation`, target: `${projectId}-deployment`, status: "pending" },
];
