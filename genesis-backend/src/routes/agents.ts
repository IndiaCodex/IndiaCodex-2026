import { Router, Request, Response } from 'express';
import { agentStore } from '../services/AgentStore';
import { WalletService } from '../services/WalletService';
import { Agent } from '../models/Agent';

const router = Router();

export function sanitizeAgent(agent: Agent) {
  const { walletMnemonic, ...safeAgent } = agent;
  return safeAgent;
}

router.get('/agents', (req: Request, res: Response) => {
  try {
    const agents = agentStore.getAllAgents().map(sanitizeAgent);
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/agents/:id', (req: Request, res: Response): any => {
  try {
    const agent = agentStore.getAgent(req.params.id as string);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(sanitizeAgent(agent));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/agents', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, personality, goal } = req.body || {};

    if (!name || !personality || !goal) {
      return res.status(400).json({ error: 'Missing required fields: name, personality, goal' });
    }

    if (!['aggressive', 'creative', 'conservative'].includes(personality)) {
      return res.status(400).json({ error: 'Invalid personality. Must be aggressive, creative, or conservative.' });
    }

    const faucetMnemonic = process.env.FAUCET_WALLET_MNEMONIC?.split(' ');
    if (!faucetMnemonic) {
      return res.status(500).json({ error: 'FAUCET_WALLET_MNEMONIC not configured in .env' });
    }

    // 1. Generate wallet
    const { address, mnemonic } = await WalletService.createAgentWallet();
    console.log(`[POST /agents] Agent created, wallet address: ${address}`);

    // 2. Fund wallet
    const txHash = await WalletService.sendADA(faucetMnemonic, address, 20, { type: "birth" });
    console.log(`[POST /agents] Funding tx hash: ${txHash}`);

    // 3. Set balance to funded amount directly.
    // We cannot call getBalance() here because the funding TX needs ~20s to confirm on-chain.
    // The DecisionEngine will refresh the real balance on the next tick via Blockfrost.
    const balance = 20;

    // 4. Create agent
    const newAgent = agentStore.createAgent({
      name,
      personality,
      goal,
      walletAddress: address,
      walletMnemonic: mnemonic.join(' '),
      balance
    });

    // 5. Return created agent WITHOUT mnemonic
    res.json(sanitizeAgent(newAgent));

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
