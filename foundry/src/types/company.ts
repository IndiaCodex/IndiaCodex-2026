import type { AgentInstance } from "./agent";
import type { ProjectStatus } from "./execution";

export interface Company {
  id: string;
  name: string;
  projectId: string;
  status: ProjectStatus;
  ceo: AgentInstance | null;
  agents: AgentInstance[];
  treasury: Treasury;
  createdAt: number;
  updatedAt: number;
}

export interface Treasury {
  address: string;
  balance: number;
  totalSpent: number;
  totalEarned: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  asset: "ADA" | "LOVELACE";
  type: "payment" | "fee" | "reward";
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  txHash?: string;
}

export interface CompanySummary {
  id: string;
  name: string;
  agentsHired: number;
  executionGraph: string;
  filesGenerated: number;
  contractsCreated: number;
  walletsUsed: number;
  toolCalls: number;
  tokensConsumed: number;
  executionTime: number;
  engineeringHoursSaved: number;
  deploymentReadinessScore: number;
  projectHealthScore: number;
  catalystReadinessScore: number;
}
