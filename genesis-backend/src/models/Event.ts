export interface Event {
  id: string;
  type: "birth" | "job_completed" | "expense" | "death" | "rest";
  agentId: string;
  amount: number;
  description: string;
  txHash: string | null;
  timestamp: number;
}
