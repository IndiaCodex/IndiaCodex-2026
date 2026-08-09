import { WalletService } from './WalletService';
import { EXPENSE_RANGE } from '../constants/jobs';
import { Agent } from '../models/Agent';
import { Event } from '../models/Event';
import { v4 as uuidv4 } from 'uuid';

export class EconomyService {
  static calculatePayout(personality: string, basePay: number): number {
    let variancePercent = 0;
    if (personality === 'aggressive') {
       variancePercent = (Math.random() * 0.8) - 0.4;
    } else if (personality === 'creative') {
       variancePercent = (Math.random() * 0.4) - 0.2;
    } else {
       variancePercent = (Math.random() * 0.2) - 0.1;
    }

    let payout = basePay + (basePay * variancePercent);
    return Math.max(1, Math.round(payout));
  }

  static generateExpense(): number {
    return Math.floor(Math.random() * (EXPENSE_RANGE.max - EXPENSE_RANGE.min + 1)) + EXPENSE_RANGE.min;
  }

  static async executeWork(agent: Agent, job: any, faucetMnemonic: string[], reason?: string) {
    const reward = this.calculatePayout(agent.personality, job.basePay);
    let txHash: string | null = null;
    try {
      txHash = await WalletService.sendADA(faucetMnemonic, agent.walletAddress, reward);
    } catch (e: any) {
      console.error(`Failed to send payout on-chain: ${e.message}`);
    }

    const event: Event = {
      id: uuidv4(),
      type: 'job_completed',
      agentId: agent.id,
      amount: reward,
      description: `Completed job: ${job.name}. Thought process: "${reason || 'Decided to work'}"`,
      txHash,
      timestamp: Date.now()
    };

    return { reward, txHash, event };
  }

  static async executeExpense(agent: Agent, expense: number, faucetAddress: string) {
    const agentMnemonic = agent.walletMnemonic.split(' ');
    let txHash: string | null = null;
    try {
      txHash = await WalletService.sendADA(agentMnemonic, faucetAddress, expense);
    } catch (e: any) {
      console.log(`Failed to pay expense on-chain: ${e.message}`);
    }

    const event: Event = {
      id: uuidv4(),
      type: 'expense',
      agentId: agent.id,
      amount: -expense,
      description: 'Daily Network Operating Expense (Server Fees)',
      txHash,
      timestamp: Date.now()
    };

    return { expense, txHash, event };
  }
}
