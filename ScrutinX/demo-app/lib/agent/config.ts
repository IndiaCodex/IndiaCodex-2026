/**
 * Central config + the two runtime TOGGLES.
 *
 *   congestionMode: 'real' -> pull live block fullness from Blockfrost
 *                   'demo' -> use a controllable simulated score (slider / synthetic wave)
 *
 *   settlementMode: 'real' -> build + sign + submit a real batch tx on Preprod (Lucid + seed wallet)
 *                   'demo' -> return a realistic *simulated* SettlementResult (no chain call)
 *
 * Both default to 'demo' so the app ALWAYS runs with zero chain access. Flip to 'real' when the
 * on-chain side is ready (or via the UI toggles). See setCongestionMode / setSettlementMode.
 */

export type Mode = "real" | "demo";

export const config = {
  // --- TOGGLES (mutable at runtime) ---
  congestionMode: (process.env.CONGESTION_MODE as Mode) || "demo",
  settlementMode: (process.env.SETTLEMENT_MODE as Mode) || "demo",

  // --- Chain API (Preprod). URL is env-driven so the SAME client works against Blockfrost,
  //     Yaci DevKit (local, no key), or Koios by changing BLOCKFROST_URL. See Docs/cardano-tools.md. ---
  blockfrost: {
    url:
      process.env.BLOCKFROST_URL ||
      "https://cardano-preprod.blockfrost.io/api/v0",
    projectId: process.env.BLOCKFROST_PROJECT_ID || "", // server-side only; empty for Yaci
  },

  // --- On-chain wiring (filled in once the validator is deployed) ---
  walletSeed: process.env.WALLET_SEED || "", // 24-word mnemonic, SERVER ONLY, never ship to client
  scriptAddress: process.env.SCRIPT_ADDRESS || "",
  plutusJsonPath: process.env.PLUTUS_JSON_PATH || "../on-chain/plutus.json",

  // --- Congestion model ---
  // alpha/poll tuned for a responsive DEMO (slider feels live). For a real-block-accurate signal you'd
  // use alpha≈0.3 and poll≈20_000 (Cardano block time); the demo trades a little smoothing for snappiness.
  ewmaAlpha: 0.4, // larger = reacts faster / noisier
  recentBlocks: 10, // window used to seed the EWMA on startup
  pollIntervalMs: 1_500, // demo-snappy; raise to ~20_000 for real-block cadence

  // --- Batch policy (congestion score -> timing) ---
  policy: {
    highThreshold: 0.7, // score above -> congested
    lowThreshold: 0.3, // score below -> quiet
    congestedWindowMs: 60_000,
    quietWindowMs: 7_000,
  },

  // Max claims per settlement tx. MEASURED ON-CHAIN: the spend handler runs once PER input and each run
  // does O(n²) work → real cost is ~O(n³). 5 claims confirmed fine; 16 blew the memory budget (failed at
  // input ~7). So the real N_max ≈ 6–7 with this validator. batchCap=6 is safe. The Dict-based O(1)
  // lookup optimization (→ ~O(n²) total) is what raises this materially. See onchain-spec.md §6.
  batchCap: 6,

  // Naive-side "fees saved" baseline: the REAL measured single-claim fee on Preprod (tx 0531d1a3…,
  // fee 238,189 lovelace). Batching 5 in one tx measured 593,035 → ~53% saved vs 5 separate claims.
  singleClaimFeeLovelace: 238_189,
};

export function setCongestionMode(m: Mode) {
  config.congestionMode = m;
}
export function setSettlementMode(m: Mode) {
  config.settlementMode = m;
}

/** True only when we have everything needed to talk to the chain. */
export function realChainReady(): boolean {
  return Boolean(config.blockfrost.projectId);
}
export function realSettlementReady(): boolean {
  return Boolean(
    config.blockfrost.projectId && config.walletSeed && config.scriptAddress
  );
}
