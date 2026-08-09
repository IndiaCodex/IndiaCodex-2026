import { Event } from './Event';

export interface BalanceSnapshot {
  balance: number;
  timestamp: number;
}

export interface Agent {
  id: string;
  name: string;
  personality: "aggressive" | "conservative" | "creative";
  goal: string;
  walletAddress: string;
  walletMnemonic: string;
  balance: number;
  alive: boolean;
  bornAt: number;
  diedAt: number | null;
  history: Event[];
  // ── Economy stats (computed as we go) ───────────────────────
  totalEarned: number;
  totalSpent: number;
  jobsCompleted: number;
  balanceHistory: BalanceSnapshot[];
}
