export interface Stats {
  health: number;
  energy: number;
  experience: number;
  level: number;
}

export interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'working' | 'offline';
  stats: Stats;
  createdAt: string;
  updatedAt: string;
  personality: string;
  goal: string;
  adaBalance: number;
  isAlive: boolean;
  diedAt?: string | null;
}

export interface Event {
  id: string;
  agentId: string;
  type: 'spawn' | 'task_start' | 'task_complete' | 'error' | 'tick' | 'system';
  message: string;
  timestamp: string;
  amount?: number;
  txHash?: string;
}
