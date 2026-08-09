import 'dotenv/config';

const BASE = 'http://localhost:4000';

const DEMO_AGENTS = [
  {
    name: 'Alpha-7',
    personality: 'aggressive',
    goal: 'Dominate the Cardano economy by taking high-risk smart contract audit jobs and maximising ADA returns'
  },
  {
    name: 'Nova-Creative',
    personality: 'creative',
    goal: 'Build a reputation through whitepaper writing and tokenomics design to fund long-term growth'
  },
  {
    name: 'Vega-Steady',
    personality: 'conservative',
    goal: 'Survive as long as possible through low-risk data cleanup and market research jobs'
  },
  {
    name: 'Riko-Maverick',
    personality: 'aggressive',
    goal: 'Win the leaderboard through on-chain analytics and API integration at all costs'
  },
];

async function post(path: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

async function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🔍 Checking existing agents...');
  const existing = await fetch(`${BASE}/api/agents`).then(r => r.json());

  if (existing.length >= 4) {
    console.log(`✅ Already have ${existing.length} agents. No need to spawn more.`);
    console.log('\nExisting agents:');
    existing.forEach((a: any, i: number) => {
      console.log(`  ${i + 1}. ${a.name} (${a.personality}) — ${a.balance} ADA — ${a.alive ? '🟢 Alive' : '💀 Dead'}`);
    });
    process.exit(0);
  }

  const toSpawn = DEMO_AGENTS.slice(0, 4 - existing.length);
  console.log(`\n🚀 Spawning ${toSpawn.length} demo agent(s)...\n`);

  for (const agent of toSpawn) {
    console.log(`  Spawning ${agent.name} (${agent.personality})...`);
    const result = await post('/api/agents', agent);
    if (result.error) {
      console.error(`  ❌ Failed: ${result.error}`);
    } else {
      console.log(`  ✅ ${result.name} born — wallet: ${result.walletAddress?.slice(0, 24)}... — ${result.balance} ADA`);
    }
    await delay(6000); // give faucet time between spawns
  }

  console.log('\n⏳ Waiting 30s for all funding TXs to confirm on Cardano testnet...');
  await delay(30000);

  console.log('\n⚡ Running 3 ticks to generate activity...');
  for (let i = 1; i <= 3; i++) {
    console.log(`  Tick ${i}/3...`);
    const result = await post('/api/tick');
    console.log(`  ✅ Tick ${result.tick} — processed: ${result.processed}, deaths: ${result.deaths}, events: ${result.events?.length ?? 0}`);
    if (i < 3) await delay(10000);
  }

  const finalAgents = await fetch(`${BASE}/api/agents`).then(r => r.json());
  const finalEvents = await fetch(`${BASE}/api/events`).then(r => r.json());

  console.log('\n═══════════════════════════════════════════');
  console.log('🎯 DEMO READY — open http://localhost:3000');
  console.log('═══════════════════════════════════════════');
  console.log(`Agents  : ${finalAgents.length} (${finalAgents.filter((a:any) => a.alive).length} alive)`);
  console.log(`Events  : ${finalEvents.length}`);
  console.log('\nLeaderboard:');
  [...finalAgents]
    .sort((a: any, b: any) => b.balance - a.balance)
    .forEach((a: any, i: number) => {
      const medal = ['🥇','🥈','🥉'][i] || `  ${i+1}.`;
      console.log(`  ${medal} ${a.name.padEnd(16)} ${(a.balance).toFixed(2)} ADA  ${a.alive ? '🟢' : '💀'}`);
    });
}

main().catch(console.error);
