/**
 * Real BATCH settlement: claim N Open tickets in ONE transaction on Preprod — the core on-chain proof.
 * Run:  npm run batch          (settles 5 by default; BATCH_N to change)
 * Needs funded WALLET_SEED + BLOCKFROST_PROJECT_ID + seeded tickets (`npm run seed`).
 */

import { getAddressUtxos } from "@/lib/agent/blockfrostClient";
import { settleBatch } from "@/lib/agent/settlement";
import { config, setSettlementMode } from "@/lib/agent/config";

const N = Number(process.env.BATCH_N ?? 5);

async function main() {
  setSettlementMode("real");
  if (!config.blockfrost.projectId || !config.walletSeed || !config.scriptAddress) {
    throw new Error("Set BLOCKFROST_PROJECT_ID, WALLET_SEED, SCRIPT_ADDRESS in .env.local first.");
  }

  // Decode datums so we only pick tickets that are still Open (a Claimed input would be rejected on-chain).
  const { Data } = (await import("@lucid-evolution/lucid")) as any;
  const StatusSchema = Data.Enum([Data.Literal("Open"), Data.Literal("Claimed")]);
  const BatchDatumSchema = Data.Object({
    owner: Data.Bytes(),
    item_id: Data.Bytes(),
    status: StatusSchema,
  });

  const utxos = await getAddressUtxos(config.scriptAddress);
  const open = utxos
    .filter((u: any) => {
      if (!u.inline_datum) return false;
      try {
        return Data.from(u.inline_datum, BatchDatumSchema).status === "Open";
      } catch {
        return false;
      }
    })
    .slice(0, N);

  if (open.length < 1) throw new Error("No Open tickets at the script address — run `npm run seed`.");
  console.log(`Batching ${open.length} Open tickets into ONE settlement tx...`);

  const requests = open.map((u: any, i: number) => ({
    id: `batch-${i}`,
    kind: "claim" as const,
    targetUtxoRef: `${u.tx_hash}#${u.output_index}`,
    claimant: "00".repeat(28),
    ts: i,
  }));

  const result = await settleBatch({ requests, builtAtScore: 0.5 });
  console.log(JSON.stringify(result, null, 2));
  if (result.explorerUrl) console.log("View:", result.explorerUrl);
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
