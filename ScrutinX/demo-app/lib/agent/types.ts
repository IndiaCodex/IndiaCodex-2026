/** Shared types across the off-chain pipeline. Keep this the single source of truth. */

export interface UserRequest {
  id: string; // uuid
  kind: "claim" | "swap"; // MVP: "claim"
  targetUtxoRef: string; // "txHash#index" — the ticket UTXO this request wants to spend
  claimant: string; // verification key hash (hex)
  ts: number; // arrival time (ms), passed in from the caller
}

export interface ContentionGraph {
  nodes: string[]; // request ids
  edges: Array<[string, string]>; // conflicting id pairs
  adjacency: Map<string, Set<string>>;
}

export interface Batch {
  requests: UserRequest[];
  builtAtScore: number; // congestion score when this batch was chosen (telemetry / UI)
}

export interface SettlementResult {
  txHash: string;
  batchSize: number;
  feeLovelace: number; // actual (real) or estimated (demo) fee of the batched tx
  naiveFeeEstimate: number; // what the same requests would cost as separate txs
  savedLovelace: number; // naiveFeeEstimate - feeLovelace
  mode: "real" | "demo"; // which path produced this
  explorerUrl?: string; // Cardanoscan link (real mode only)
}

/** A block summary as we consume it from Blockfrost (only the fields we need). */
export interface BlockSummary {
  height: number;
  size: number; // block size in bytes
  txCount: number;
}

export interface ProtocolParams {
  minFeeA: number; // lovelace/byte
  minFeeB: number; // lovelace flat
  maxBlockSize: number; // bytes
  priceMem: number;
  priceStep: number;
  maxTxExMem: number;
  maxTxExSteps: number;
}
