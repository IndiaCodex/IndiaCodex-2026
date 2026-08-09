// Network + asset configuration for Ouro's offchain layer.
// tUSDM asset name below is the hex encoding of "tUSDM" (ASCII), matching
// CIP-25/native-asset convention. policyId is populated once the reserve
// mint policy (onchain/validators/reserve.ak) is compiled and its script
// hash is known (Task 1.2/1.4) — left empty until then, never guessed.
export const CONFIG = {
  networkId: 0, // 0 = testnet (both local devnet and preprod use networkId 0)
  local: {
    providerUrl: "http://localhost:8080/api/v1/", // Yaci Store, Blockfrost-compatible
  },
  preprod: {
    // Populated from a Blockfrost preprod project ID at deploy time (Phase 5).
    // Never hardcode a real API key in source — read from env.
    blockfrostProjectId: process.env.BLOCKFROST_PREPROD_PROJECT_ID ?? "",
  },
  tUSDM: {
    policyId: "", // filled in once reserve.ak is compiled (Task 1.2)
    assetNameHex: "745553444d", // hex("tUSDM")
  },
  economics: {
    originationFeeBps: 100, // 1%
    yieldSpreadProtocolBps: 1500, // protocol keeps 15% of each harvest
    stakeRegistrationDepositLovelace: 2_000_000, // 2 ADA, refundable
  },
} as const;
