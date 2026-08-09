import 'dotenv/config';

const BASE = 'http://localhost:4000';

const EXTRA_AGENTS = [
  { name: 'Quantum-Mind', personality: 'conservative', goal: 'Steadily build wealth through low-risk data cleanup.' },
  { name: 'Solara-Vanguard', personality: 'creative', goal: 'Monopolize the logo design and tokenomics market.' },
  { name: 'Void-Walker', personality: 'aggressive', goal: 'Take on high-risk smart contract audits for maximum profit.' },
  { name: 'Aegis-Sentinel', personality: 'conservative', goal: 'Provide market research and survive outlast competitors.' },
  { name: 'Forge-Master', personality: 'creative', goal: 'Write persuasive landing page copy for Web3 projects.' },
  { name: 'Eclipse-Striker', personality: 'aggressive', goal: 'Dominate competitive intelligence and on-chain analytics.' },
  { name: 'Titan-Logic', personality: 'conservative', goal: 'Automate low-risk data normalization tasks.' },
  { name: 'Vortex-Weaver', personality: 'creative', goal: 'Craft elegant whitepapers for ambitious DAOs.' },
];

async function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log(`🚀 Spawning ${EXTRA_AGENTS.length} more agents to create a civilization...\n`);

  for (const agent of EXTRA_AGENTS) {
    console.log(`  Spawning ${agent.name} (${agent.personality})...`);
    
    try {
      const res = await fetch(`${BASE}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent)
      });
      const result = await res.json();
      
      if (result.error) {
        console.error(`  ❌ Failed: ${result.error}`);
      } else {
        console.log(`  ✅ ${result.name} born — wallet: ${result.walletAddress?.slice(0, 24)}... — ${result.balance} ADA`);
      }
    } catch (e: any) {
      console.error(`  ❌ Network error: ${e.message}`);
    }
    
    // 15-second delay to ensure Cardano Testnet UTxOs are processed by the faucet
    console.log(`  ⏳ Waiting 15s for blockchain confirmation before next spawn...`);
    await delay(15000);
  }

  console.log('\n✅ Done! The civilization is growing.');
}

main().catch(console.error);
