/**
 * Single-claim smoke test (build-plan §1.4): claim ONE Open ticket at the script address in a real
 * Preprod transaction — proving the on-chain settlement loop before batching.
 *
 * Run:  npm run claim     (needs funded WALLET_SEED + BLOCKFROST_PROJECT_ID + seeded tickets)
 * The npm script loads .env.local via `node --env-file`.
 */

import { getAddressUtxos } from "@/lib/agent/blockfrostClient";
import { settleBatch } from "@/lib/agent/settlement";
import { config, setSettlementMode } from "@/lib/agent/config";

async function main() {
  setSettlementMode("real");
  if (!config.blockfrost.projectId || !config.walletSeed || !config.scriptAddress) {
    throw new Error(
      "Set BLOCKFROST_PROJECT_ID, WALLET_SEED, and SCRIPT_ADDRESS in demo-app/.env.local first."
    );
  }

  const utxos = await getAddressUtxos(config.scriptAddress);
  if (!utxos.length) {
    throw new Error("No ticket UTXOs at the script address — run `npm run seed` first.");
  }

  const u = utxos[0];
  const ref = `${u.tx_hash}#${u.output_index}`;
  console.log("Claiming one ticket:", ref);

  const result = await settleBatch({
    requests: [
      { id: "smoke-1", kind: "claim", targetUtxoRef: ref, claimant: "00".repeat(28), ts: 0 },
    ],
    builtAtScore: 0,
  });

  console.log(JSON.stringify(result, null, 2));
  if (result.explorerUrl) console.log("View:", result.explorerUrl);
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
