// Preprod tUSDM token unit (policyId + hexAssetName)
// From Masumi docs: 16a55b2a349361ff88c03788f93e1e966e5d689605d044fef722ddde0014df10745553444d
export const TUSDM_UNIT =
  "16a55b2a349361ff88c03788f93e1e966e5d689605d044fef722ddde0014df10745553444d";

// ============================================================
// MIP-002 Registry Metadata Standard
// ============================================================

export interface MasumiCapability {
  name: string;
  version: string;
}

export interface MasumiAuthor {
  name: string;
  contact?: string;
  organization?: string;
}

export interface MasumiLegal {
  privacy_policy?: string;
  terms_of_service?: string;
  other?: string;
}

export interface MasumiPricing {
  amount: number;
  unit: string;
}

export interface MasumiRegistryMetadata {
  name: string | string[];
  description: string | string[];
  api_url: string | string[];
  example_output?: string | string[];
  capability: MasumiCapability;
  requests_per_hour?: number;
  author: MasumiAuthor;
  legal?: MasumiLegal;
  tags?: string[];
  pricing: MasumiPricing;
  image?: string;
  metadata_version: string;
}

// ============================================================
// Registry Service Types
// ============================================================

export interface RegistryEntryFilter {
  policyId?: string;
  capability?: string;
  paymentType?: string;
  status?: string;
}

export interface MasumiRegistryEntry {
  agentIdentifier: string;
  metadata: MasumiRegistryMetadata;
  status: "active" | "inactive";
}

export interface MasumiPaymentInformation {
  agentIdentifier: string;
  sellerVkey: string;
  apiBaseUrl: string;
  pricing: MasumiPricing;
  walletAddress: string;
  contactInfo?: {
    name?: string;
    email?: string;
  };
}

// ============================================================
// Payment Service – Purchase Types
// ============================================================

export type PurchaseAction =
  | "FundsLockingRequested"
  | "FundsLocked"
  | "ResultSubmitted"
  | "Completed"
  | "RefundRequested"
  | "RefundAuthorized"
  | "Disputed"
  | "RefundWithdrawn"
  | "DisputedWithdrawn"
  | "FundsOrDatumInvalid";

export interface NextAction {
  requestedAction: PurchaseAction;
  description?: string;
}

export interface MasumiPurchaseRequest {
  blockchainIdentifier: string;
  identifierFromPurchaser: string;
  sellerVkey: string;
  agentIdentifier: string;
  inputHash: string;
  submitResultTime: number;
  unlockTime: number;
  externalDisputeUnlockTime: number;
  amount: number;
  unit: string;
}

export interface MasumiPurchaseResponse {
  blockchainIdentifier?: string;
  nextAction?: NextAction;
  status?: string;
  txHash?: string;
}

export interface MasumiPaymentSource {
  vkey: string;
  walletAddress: string;
  network: string;
}

// ============================================================
// Agentic Service API (MIP-003) Types
// ============================================================

export interface StartJobRequest {
  input_data: Record<string, unknown>;
  identifier_from_purchaser: string;
}

export interface StartJobResponse {
  job_id: string;
  blockchainIdentifier: string;
  submitResultTime: number;
  unlockTime: number;
  externalDisputeUnlockTime: number;
}

export type JobStatusValue =
  | "running"
  | "awaiting_input"
  | "completed"
  | "failed";

export interface JobStatusResponse {
  status: JobStatusValue;
  output?: string;
  result_hash?: string;
  input_schema?: unknown;
  input_data?: Record<string, unknown>;
}

export interface ProvideInputRequest {
  job_id: string;
  input_data: Record<string, unknown>;
  input_schema_hash: string;
}

export interface InputSchemaField {
  id: string;
  type: string;
  label?: string;
  description?: string;
  placeholder?: string;
  default?: unknown;
  required?: boolean;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  format?: string;
}

export interface InputSchemaResponse {
  input_data?: InputSchemaField[];
  input_groups?: {
    id: string;
    label: string;
    inputs: InputSchemaField[];
  }[];
}

// ============================================================
// Foundry Agent Identity
// ============================================================

export interface MasumiAgentIdentity {
  agentIdentifier: string;
  name: string;
  registered: boolean;
  registrationTxHash?: string;
  walletVkey?: string;
  walletAddress?: string;
  metadata?: MasumiRegistryMetadata;
}

// ============================================================
// Adapter Config
// ============================================================

export interface MasumiAdapterConfig {
  registryApiUrl: string;
  paymentApiUrl: string;
  apiKey?: string;
  mockMode: boolean;
  network: "preprod" | "mainnet";
}
