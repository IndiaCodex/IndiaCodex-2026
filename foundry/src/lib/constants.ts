export const APP_NAME = "Foundry";
export const APP_DESCRIPTION = "The Operating System for Autonomous Software Companies on Cardano";

export const CARDANO_NETWORK = process.env.NEXT_PUBLIC_CARDANO_NETWORK || "preprod";
export const CARDANO_PROVIDER_URL = process.env.NEXT_PUBLIC_CARDANO_PROVIDER_URL || "";

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "";
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
export const OPENAI_MODEL_MINI = process.env.OPENAI_MODEL_MINI || "gpt-4o-mini";
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
export const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "";

export const MASUMI_MOCK = process.env.MASUMI_MOCK === "true";

const masumiBase = process.env.MASUMI_API_URL || "http://localhost:3001/api/v1";
export const MASUMI_REGISTRY_API_URL =
  process.env.MASUMI_REGISTRY_API_URL || "http://localhost:3000/api/v1";
export const MASUMI_PAYMENT_API_URL =
  process.env.MASUMI_PAYMENT_API_URL || masumiBase;
export const MASUMI_API_KEY = process.env.MASUMI_API_KEY || "";

export const TUSDM_UNIT =
  "16a55b2a349361ff88c03788f93e1e966e5d689605d044fef722ddde0014df10745553444d";

export const AGENT_FEE_PERCENTAGE = 0.85;
export const TREASURY_FEE_PERCENTAGE = 0.15;
const TREASURY_ADDRESS_RAW =
  process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "addr_test1qz2fxv2et0qxn0k...";

export const TREASURY_ADDRESS = TREASURY_ADDRESS_RAW;

/** True when a real preprod treasury address is configured (not the placeholder). */
export function isTreasuryConfigured(): boolean {
  const addr = TREASURY_ADDRESS_RAW.trim();
  if (!addr.startsWith("addr")) return false;
  if (addr.includes("...")) return false;
  if (addr.length < 58) return false;
  return true;
}

/** On-chain funding is skipped when treasury is not configured or mock funding is forced. */
export const CARDANO_MOCK_FUNDING =
  process.env.NEXT_PUBLIC_CARDANO_MOCK_FUNDING === "true" || !isTreasuryConfigured();

export const AGENT_ROLES = [
  "ceo",
  "research",
  "architecture",
  "contract-engineer",
  "frontend-engineer",
  "security-engineer",
  "qa-engineer",
  "documentation-engineer",
  "deployment-engineer",
] as const;

export const AGENT_STATUSES = [
  "idle",
  "waiting",
  "planning",
  "researching",
  "working",
  "reviewing",
  "completed",
  "failed",
] as const;

export const PROJECT_STATUSES = [
  "draft",
  "forging",
  "executing",
  "completed",
  "failed",
] as const;

export const CHAINS = ["cardano"] as const;

export const AGENT_EXECUTION_DELAY = Number(process.env.AGENT_EXECUTION_DELAY) || 400;
export const COMPLEXITY_LEVELS = ["simple", "moderate", "complex"] as const;
