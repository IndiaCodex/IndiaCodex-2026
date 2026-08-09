import type { AgentRole, AgentStatus } from "./execution";
import type { MasumiAuthor, MasumiCapability, MasumiPricing } from "./masumi";

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  avatar: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  fee: number;
  capabilities: string[];
  contextWindow: number;
  masumi: {
    capability: MasumiCapability;
    author: MasumiAuthor;
    tags: string[];
    pricing: MasumiPricing;
    requestsPerHour: number;
  };
}

export interface AgentInstance {
  id: string;
  config: AgentConfig;
  status: AgentStatus;
  wallet: WalletInfo;
  masumiIdentity: MasumiIdentity;
  currentTask: string | null;
  previousTask: string | null;
  logs: LogEntry[];
  toolCalls: ToolCall[];
  reasoning: string[];
  confidence: number;
  duration: number;
  cost: number;
  memory: AgentMemory;
  output: unknown | null;
}

export interface WalletInfo {
  address: string;
  balance: number;
  network: string;
}

export interface MasumiIdentity {
  agentIdentifier: string;
  name: string;
  registered: boolean;
  registrationTxHash?: string;
  walletVkey?: string;
  walletAddress?: string;
  reputationScore: number;
  totalEarnings: number;
  completedProjects: number;
}

export interface LogEntry {
  id: string;
  agentId: string;
  timestamp: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

export interface ToolCall {
  id: string;
  agentId: string;
  tool: string;
  input: unknown;
  output: unknown;
  timestamp: number;
  duration: number;
  status: "pending" | "success" | "error";
}

export interface AgentMemory {
  previousTasks: string[];
  successfulPatterns: string[];
  failures: string[];
  preferredStrategies: string[];
  recentOutputs: unknown[];
  embeddings?: number[];
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  input: unknown;
  expectedOutput: unknown;
  dependencies: string[];
  status: AgentStatus;
  result: unknown | null;
  error: string | null;
  startedAt: number | null;
  completedAt: number | null;
}
