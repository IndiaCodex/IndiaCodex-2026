import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { Agent } from '../models/Agent';
import { Event } from '../models/Event';

// ── Persistence paths ────────────────────────────────────────────
const DATA_DIR    = path.join(process.cwd(), 'data');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const META_FILE   = path.join(DATA_DIR, 'meta.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    }
  } catch (e) {
    console.warn(`[AgentStore] Failed to read ${filePath}:`, e);
  }
  return fallback;
}

function writeJSON(filePath: string, data: unknown): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn(`[AgentStore] Failed to write ${filePath}:`, e);
  }
}

export class AgentStore {
  private agents: Agent[] = [];
  private events: Event[] = [];
  private tickCount = 0;

  constructor() {
    this.load();
  }

  // ── Persistence ────────────────────────────────────────────────
  private load(): void {
    ensureDataDir();
    this.agents = readJSON<Agent[]>(AGENTS_FILE, []);
    this.events = readJSON<Event[]>(EVENTS_FILE, []);
    const meta  = readJSON<{ tickCount: number }>(META_FILE, { tickCount: 0 });
    this.tickCount = meta.tickCount;

    // Re-hydrate agent.history from the global events array
    // (events are stored flat, so re-link them to their agent)
    for (const agent of this.agents) {
      agent.history = this.events.filter(e => e.agentId === agent.id);
    }

    console.log(`[AgentStore] Loaded ${this.agents.length} agents, ${this.events.length} events, tick ${this.tickCount}`);
  }

  private save(): void {
    ensureDataDir();
    // Strip circular history references — save agents without embedded history
    const agentsToSave = this.agents.map(a => ({ ...a, history: [] }));
    writeJSON(AGENTS_FILE, agentsToSave);
    writeJSON(EVENTS_FILE, this.events);
    writeJSON(META_FILE, { tickCount: this.tickCount });
  }

  // ── Tick counter ───────────────────────────────────────────────
  incrementTick(): void {
    this.tickCount++;
    this.save();
  }

  getTickCount(): number {
    return this.tickCount;
  }

  // ── Agent CRUD ─────────────────────────────────────────────────
  createAgent(agentData: Omit<Agent, 'id' | 'bornAt' | 'alive' | 'history' | 'diedAt' | 'totalEarned' | 'totalSpent' | 'jobsCompleted' | 'balanceHistory'>): Agent {
    const id = uuidv4();
    const bornAt = Date.now();

    const newAgent: Agent = {
      ...agentData,
      id,
      bornAt,
      alive: true,
      history: [],
      diedAt: null,
      totalEarned: 0,
      totalSpent: 0,
      jobsCompleted: 0,
      balanceHistory: [{ balance: agentData.balance, timestamp: bornAt }]
    };

    this.agents.push(newAgent);

    const birthEvent: Event = {
      id: uuidv4(),
      type: 'birth',
      agentId: id,
      amount: 0,
      description: 'Agent was born.',
      txHash: null,
      timestamp: bornAt
    };

    this.addEvent(id, birthEvent);
    this.save();
    return newAgent;
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.find(a => a.id === id);
  }

  getAllAgents(): Agent[] {
    return this.agents;
  }

  updateBalance(id: string, newBalance: number): void {
    const agent = this.getAgent(id);
    if (agent) {
      agent.balance = Math.max(0, newBalance);
      agent.balanceHistory.push({ balance: agent.balance, timestamp: Date.now() });
      this.save();
    }
  }

  recordIncome(id: string, amount: number): void {
    const agent = this.getAgent(id);
    if (agent) {
      agent.totalEarned += amount;
      agent.jobsCompleted++;
      this.save();
    }
  }

  recordExpense(id: string, amount: number): void {
    const agent = this.getAgent(id);
    if (agent) {
      agent.totalSpent += amount;
      this.save();
    }
  }

  addEvent(agentId: string, event: Event): void {
    const agent = this.getAgent(agentId);
    if (agent) {
      this.events.push(event);
      agent.history.push(event);
      this.save();
    }
  }

  killAgent(id: string): void {
    const agent = this.getAgent(id);
    if (!agent || !agent.alive) return;

    agent.alive = false;
    agent.diedAt = Date.now();

    const deathEvent: Event = {
      id: uuidv4(),
      type: 'death',
      agentId: id,
      amount: 0,
      description: 'Agent ran out of funds and was permanently terminated.',
      txHash: null,
      timestamp: agent.diedAt
    };

    this.addEvent(id, deathEvent);
    this.save();
  }

  getAllEvents(): Event[] {
    return [...this.events].sort((a, b) => b.timestamp - a.timestamp);
  }

  getGlobalStats() {
    const alive = this.agents.filter(a => a.alive);
    const dead  = this.agents.filter(a => !a.alive);
    const totalADA     = this.agents.reduce((s, a) => s + a.balance, 0);
    const totalEarned  = this.agents.reduce((s, a) => s + a.totalEarned, 0);
    const totalSpent   = this.agents.reduce((s, a) => s + a.totalSpent, 0);
    const totalJobs    = this.agents.reduce((s, a) => s + a.jobsCompleted, 0);

    return {
      totalAgents: this.agents.length,
      aliveAgents: alive.length,
      deadAgents:  dead.length,
      totalADA:    Math.round(totalADA * 100) / 100,
      totalEarned,
      totalSpent,
      totalJobs,
      totalEvents: this.events.length,
      ticksRun:    this.tickCount
    };
  }
}

export const agentStore = new AgentStore();
