const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Agent field mapping ──────────────────────────────────────────
function mapAgent(raw: any) {
  return {
    id: raw.id,
    name: raw.name,
    personality: raw.personality,
    goal: raw.goal,
    walletAddress: raw.walletAddress,
    adaBalance: raw.balance ?? 0,
    isAlive: raw.alive ?? true,
    createdAt: raw.bornAt ? new Date(raw.bornAt).toISOString() : new Date().toISOString(),
    diedAt: raw.diedAt ? new Date(raw.diedAt).toISOString() : null,
    status: raw.alive ? 'idle' : 'terminated',
    stats: {
      health: raw.alive ? Math.min(100, Math.round((raw.balance / 20) * 100)) : 0,
      energy: raw.alive ? 80 : 0,
      experience: (raw.jobsCompleted ?? 0) * 10,
      level: Math.floor((raw.jobsCompleted ?? 0) / 5) + 1,
    },
    totalEarned: raw.totalEarned ?? 0,
    totalSpent: raw.totalSpent ?? 0,
    jobsCompleted: raw.jobsCompleted ?? 0,
    balanceHistory: raw.balanceHistory ?? [],
    events: (raw.history ?? []).map(mapEvent),
  };
}

// ── Event field mapping ──────────────────────────────────────────
function mapEvent(backendEvent: any): Event {
  let frontendType: Event['type'] = 'system';
  if (backendEvent.type === 'birth') frontendType = 'spawn';
  else if (backendEvent.type === 'job_completed') frontendType = 'task_complete';
  else if (backendEvent.type === 'expense') frontendType = 'tick';
  else if (backendEvent.type === 'death') frontendType = 'error';
  else if (backendEvent.type === 'rest') frontendType = 'system';

  return {
    id: backendEvent.id,
    agentId: backendEvent.agentId,
    type: frontendType,
    message: backendEvent.description,
    timestamp: new Date(backendEvent.timestamp).toISOString(),
    amount: backendEvent.amount,
    txHash: backendEvent.txHash || undefined,
  };
}

// ── Type for Event (local, matches frontend Event interface) ─────
interface Event {
  id: string;
  agentId: string;
  type: 'spawn' | 'task_complete' | 'tick' | 'error' | 'system';
  message: string;
  timestamp: string;
  amount?: number;
  txHash?: string;
}

// ── Public API functions ─────────────────────────────────────────
export async function fetchAgents() {
  const data = await request<any[]>('/api/agents');
  return data.map(mapAgent);
}

export async function fetchAgent(id: string) {
  const data = await request<any>(`/api/agents/${id}`);
  return mapAgent(data);
}

export async function fetchEvents() {
  const data = await request<any[]>('/api/events');
  return data.map(mapEvent);
}

export async function spawnAgent(body: { name: string; personality: string; goal: string }) {
  const data = await request<any>('/api/agents', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return mapAgent(data);
}

export async function runTick() {
  return request<any>('/api/tick', { method: 'POST' });
}

export async function fetchStats() {
  return request<{
    totalAgents: number;
    aliveAgents: number;
    deadAgents: number;
    totalADA: number;
    totalEarned: number;
    totalSpent: number;
    totalJobs: number;
    totalEvents: number;
    ticksRun: number;
  }>('/api/stats');
}

export async function fetchJobs() {
  return request<{
    name: string;
    category: string;
    basePay: number;
    risk: string;
    description: string;
  }[]>('/api/jobs');
}

export async function startAutoTick(intervalSeconds = 30) {
  return request<any>('/api/tick/auto/start', {
    method: 'POST',
    body: JSON.stringify({ intervalSeconds }),
  });
}

export async function stopAutoTick() {
  return request<any>('/api/tick/auto/stop', { method: 'POST' });
}

export async function fetchAutoTickStatus() {
  return request<{ running: boolean; intervalSeconds: number; ticksRun: number }>('/api/tick/auto/status');
}
