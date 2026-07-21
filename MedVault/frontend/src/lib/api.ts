/**
 * The single place the frontend talks to the backend.
 * Swap NEXT_PUBLIC_API_URL to point at staging/production - no page changes.
 */

const BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const TOKENS_KEY = "medvault.tokens";

type Tokens = { access_token: string; refresh_token: string };

export function getTokens(): Tokens | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) ?? "null");
  } catch {
    return null;
  }
}

export function setTokens(tokens: Tokens | null) {
  if (tokens) localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  else localStorage.removeItem(TOKENS_KEY);
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean; retry?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, auth = true, retry = true } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const tokens = getTokens();
  if (auth && tokens) headers.Authorization = `Bearer ${tokens.access_token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // Access token expired? Refresh once, transparently, then retry.
  if (res.status === 401 && auth && retry && tokens?.refresh_token) {
    const refreshed = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
    if (refreshed.ok) {
      setTokens(await refreshed.json());
      return request<T>(path, { ...opts, retry: false });
    }
    setTokens(null);
  }

  if (!res.ok) {
    let code = "unknown_error";
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      code = data?.error?.code ?? code;
      message = data?.error?.message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, code, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------- typed endpoints ----------

export type UserOut = {
  id: string; email: string; role: "user" | "admin";
  is_active: boolean; created_at: string;
};
export type PlanOut = {
  id: string; name: string; description: string | null;
  coverage_lovelace: number; premium_lovelace: number;
  period_days: number; max_claims_per_year: number; is_active: boolean;
};
export type PolicyOut = {
  id: string; plan_id: string; status: string; commitment_hash: string;
  start_date: string | null; next_premium_due: string | null; created_at: string;
};
export type PremiumOut = {
  id: string; policy_id: string; amount_lovelace: number; tx_hash: string;
  status: string; confirmed_at: string | null; created_at: string;
};
export type ClaimOut = {
  id: string; policy_id: string; claim_reference: string;
  amount_lovelace: number; status: string; payout_tx_hash: string | null;
  decided_at: string | null; created_at: string;
};
export type WalletOut = {
  id: string; address: string; network: string; is_verified: boolean;
  verified_at: string | null; created_at: string;
};
export type PoolStatusOut = {
  total_pool_lovelace: number; allocated_lovelace: number; liquid_lovelace: number;
  allocation_cap_bps: number; current_allocation_bps: number;
  premiums_collected_lovelace: number; yield_earned_lovelace: number;
  claims_paid_lovelace: number;
};
export type AllocationOut = {
  id: string; strategy: string; amount_lovelace: number; target_bps: number;
  status: string; tx_hash: string | null; created_at: string;
};
export type TransactionOut = {
  id: string; type: string; direction: "in" | "out"; amount_lovelace: number;
  tx_hash: string | null; status: string; created_at: string;
};
export type AuditLogOut = {
  id: string; actor_id: string | null; action: string; entity: string;
  entity_id: string | null; created_at: string;
};

export const api = {
  register: (email: string, password: string) =>
    request<UserOut>("/auth/register", { method: "POST", body: { email, password }, auth: false }),
  login: async (email: string, password: string) => {
    const tokens = await request<Tokens>("/auth/login", {
      method: "POST", body: { email, password }, auth: false,
    });
    setTokens(tokens);
    return request<UserOut>("/users/me");
  },
  me: () => request<UserOut>("/users/me"),
  logout: () => setTokens(null),

  wallets: {
    list: () => request<WalletOut[]>("/wallets"),
    challenge: (address: string) =>
      request<{ nonce: string; expires_at: string }>("/wallets/challenge", {
        method: "POST", body: { address },
      }),
    verify: (address: string, signature: string, key = "") =>
      request<WalletOut>("/wallets/verify", {
        method: "POST", body: { address, signature, key },
      }),
  },

  plans: { list: () => request<PlanOut[]>("/plans", { auth: false }) },

  policies: {
    mine: () => request<PolicyOut[]>("/policies/me"),
    enroll: (plan_id: string) =>
      request<PolicyOut>("/policies", { method: "POST", body: { plan_id } }),
  },

  premiums: {
    mine: () => request<PremiumOut[]>("/premiums/me"),
    deposit: (policy_id: string, tx_hash: string) =>
      request<PremiumOut>("/premiums/deposit", {
        method: "POST", body: { policy_id, tx_hash },
      }),
  },

  claims: {
    mine: () => request<ClaimOut[]>("/claims/me"),
    submit: (policy_id: string, amount_lovelace: number, proof_payload: object) =>
      request<ClaimOut>("/claims", {
        method: "POST", body: { policy_id, amount_lovelace, proof_payload },
      }),
    all: () => request<ClaimOut[]>("/claims"),
    approve: (id: string) => request<ClaimOut>(`/claims/${id}/approve`, { method: "POST" }),
    reject: (id: string) => request<ClaimOut>(`/claims/${id}/reject`, { method: "POST" }),
    payout: (id: string) => request<ClaimOut>(`/claims/${id}/payout`, { method: "POST" }),
  },

  pool: {
    status: () => request<PoolStatusOut>("/pool/status", { auth: false }),
    allocations: () => request<AllocationOut[]>("/pool/allocations"),
    allocate: (strategy: string, amount_lovelace: number) =>
      request<AllocationOut>("/pool/allocations", {
        method: "POST", body: { strategy, amount_lovelace },
      }),
    withdraw: (id: string) =>
      request<AllocationOut>(`/pool/allocations/${id}/withdraw`, { method: "POST" }),
  },

  transactions: { mine: () => request<TransactionOut[]>("/transactions/me") },
  auditLogs: () => request<AuditLogOut[]>("/audit-logs"),
};

/** Generates a unique demo wallet address (dev flow). Wallet addresses are
 * unique per account server-side, so each user needs their own. */
export function randomDemoWallet(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 40; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `addr_test1q${s}`;
}

/** Builds a mock-chain deposit hash (dev mode): mocktx:<from>:<lovelace> */
export function mockDepositTx(from: string, lovelace: number) {
  return `mocktx:${from}:${lovelace}`;
}
